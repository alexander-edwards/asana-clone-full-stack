const express = require('express');
const { body, param } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all workspaces for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workspaces = await db.query(
      `SELECT DISTINCT w.*, wm.role as user_role
       FROM workspaces w
       INNER JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.userId]
    );

    res.json(workspaces.rows);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to get workspaces' });
  }
});

// Create a new workspace
router.post('/', authMiddleware, [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('is_private').optional().isBoolean(),
  validate
], async (req, res) => {
  try {
    const { name, description, color, is_private } = req.body;

    // Get user's organization
    const userResult = await db.query('SELECT organization_id FROM users WHERE id = $1', [req.userId]);
    const organizationId = userResult.rows[0]?.organization_id;

    if (!organizationId) {
      return res.status(400).json({ error: 'User must belong to an organization' });
    }

    // Create workspace
    const workspaceResult = await db.query(
      `INSERT INTO workspaces (name, description, organization_id, color, is_private, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, organizationId, color, is_private || false, req.userId]
    );

    const workspace = workspaceResult.rows[0];

    // Add creator as admin member
    await db.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspace.id, req.userId, 'admin']
    );

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get workspace details
router.get('/:id', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workspace = await db.query(
      `SELECT w.*, 
              COUNT(DISTINCT wm.user_id) as member_count,
              COUNT(DISTINCT p.id) as project_count
       FROM workspaces w
       LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
       LEFT JOIN projects p ON w.id = p.workspace_id
       WHERE w.id = $1
       GROUP BY w.id`,
      [id]
    );

    if (workspace.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json(workspace.rows[0]);
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

// Update workspace
router.put('/:id', authMiddleware, [
  param('id').isUUID(),
  body('name').optional().trim(),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('is_private').optional().isBoolean(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_private } = req.body;

    // Check if user is admin
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can update workspace' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (color) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (is_private !== undefined) {
      updates.push(`is_private = $${paramCount++}`);
      values.push(is_private);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `
      UPDATE workspaces 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Get workspace members
router.get('/:id/members', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await db.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, wm.role, wm.joined_at
       FROM workspace_members wm
       INNER JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1
       ORDER BY wm.joined_at`,
      [id]
    );

    res.json(members.rows);
  } catch (error) {
    console.error('Get workspace members error:', error);
    res.status(500).json({ error: 'Failed to get workspace members' });
  }
});

// Add member to workspace
router.post('/:id/members', authMiddleware, [
  param('id').isUUID(),
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['member', 'admin']),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    // Check if user is admin
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can add members' });
    }

    // Find user by email
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newUserId = userResult.rows[0].id;

    // Check if already a member
    const existingMember = await db.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, newUserId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add member
    await db.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [id, newUserId, role]
    );

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from workspace
router.delete('/:id/members/:userId', authMiddleware, [
  param('id').isUUID(),
  param('userId').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check if user is admin
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only workspace admins can remove members' });
    }

    // Don't allow removing the last admin
    if (userId === req.userId) {
      const adminCount = await db.query(
        'SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = $2',
        [id, 'admin']
      );
      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }

    await db.query(
      'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
