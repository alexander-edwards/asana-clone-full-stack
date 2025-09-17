const express = require('express');
const { body, param } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all teams in a workspace
router.get('/', authMiddleware, [
  body('workspace_id').optional().isUUID(),
  validate
], async (req, res) => {
  try {
    const { workspace_id } = req.query;

    let query;
    let params;

    if (workspace_id) {
      query = `
        SELECT t.*, COUNT(tm.user_id) as member_count
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        WHERE t.workspace_id = $1
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `;
      params = [workspace_id];
    } else {
      // Get all teams user is a member of
      query = `
        SELECT t.*, w.name as workspace_name, COUNT(tm2.user_id) as member_count
        FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN team_members tm2 ON t.id = tm2.team_id
        LEFT JOIN workspaces w ON t.workspace_id = w.id
        WHERE tm.user_id = $1
        GROUP BY t.id, w.name
        ORDER BY t.created_at DESC
      `;
      params = [req.userId];
    }

    const teams = await db.query(query, params);
    res.json(teams.rows);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Create a new team
router.post('/', authMiddleware, [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('workspace_id').isUUID(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  validate
], async (req, res) => {
  try {
    const { name, description, workspace_id, color } = req.body;

    // Check if user has access to workspace
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace_id, req.userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create team
    const teamResult = await db.query(
      `INSERT INTO teams (name, description, workspace_id, color, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, workspace_id, color, req.userId]
    );

    const team = teamResult.rows[0];

    // Add creator as team admin
    await db.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [team.id, req.userId, 'admin']
    );

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get team members
router.get('/:id/members', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    const members = await db.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, tm.role, tm.joined_at
       FROM team_members tm
       INNER JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at`,
      [id]
    );

    res.json(members.rows);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Add member to team
router.post('/:id/members', authMiddleware, [
  param('id').isUUID(),
  body('user_id').isUUID(),
  body('role').optional().isIn(['member', 'admin']),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    // Check if user is team admin
    const adminCheck = await db.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can add members' });
    }

    // Check if already a member
    const existingMember = await db.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    await db.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [id, user_id, role]
    );

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

module.exports = router;
