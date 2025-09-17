const express = require('express');
const { body, param, query } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all projects for a workspace
router.get('/', authMiddleware, [
  query('workspace_id').optional().isUUID(),
  validate
], async (req, res) => {
  try {
    const { workspace_id } = req.query;
    
    let projectsQuery;
    let queryParams;

    if (workspace_id) {
      // Check if user has access to workspace
      const memberCheck = await db.query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [workspace_id, req.userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }

      projectsQuery = `
        SELECT p.*, 
               u.name as owner_name,
               t.name as team_name,
               COUNT(DISTINCT tk.id) as task_count,
               COUNT(DISTINCT pm.user_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN tasks tk ON p.id = tk.project_id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.workspace_id = $1
        GROUP BY p.id, u.name, t.name
        ORDER BY p.created_at DESC
      `;
      queryParams = [workspace_id];
    } else {
      // Get all projects user has access to
      projectsQuery = `
        SELECT DISTINCT p.*, 
               u.name as owner_name,
               t.name as team_name,
               w.name as workspace_name,
               COUNT(DISTINCT tk.id) as task_count,
               COUNT(DISTINCT pm.user_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN workspaces w ON p.workspace_id = w.id
        LEFT JOIN tasks tk ON p.id = tk.project_id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id IN (
          SELECT project_id FROM project_members WHERE user_id = $1
          UNION
          SELECT id FROM projects WHERE owner_id = $1
          UNION
          SELECT p.id FROM projects p
          INNER JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
          WHERE wm.user_id = $1 AND p.is_public = true
        )
        GROUP BY p.id, u.name, t.name, w.name
        ORDER BY p.created_at DESC
      `;
      queryParams = [req.userId];
    }

    const projects = await db.query(projectsQuery, queryParams);
    res.json(projects.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Create a new project
router.post('/', authMiddleware, [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('workspace_id').isUUID(),
  body('team_id').optional().isUUID(),
  body('status').optional().isIn(['active', 'archived', 'on_hold']),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim(),
  body('view_type').optional().isIn(['list', 'board', 'timeline', 'calendar']),
  body('is_template').optional().isBoolean(),
  body('is_public').optional().isBoolean(),
  body('due_date').optional().isISO8601(),
  validate
], async (req, res) => {
  try {
    const {
      name, description, workspace_id, team_id, status, color,
      icon, view_type, is_template, is_public, due_date
    } = req.body;

    // Check if user has access to workspace
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace_id, req.userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create project
    const projectResult = await db.query(
      `INSERT INTO projects (
        name, description, workspace_id, team_id, status, color, icon,
        view_type, is_template, is_public, owner_id, due_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name, description, workspace_id, team_id, status || 'active', color,
        icon, view_type || 'list', is_template || false, is_public || false,
        req.userId, due_date, req.userId
      ]
    );

    const project = projectResult.rows[0];

    // Add creator as project member
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.userId, 'owner']
    );

    // Create default sections
    const defaultSections = ['To Do', 'In Progress', 'Complete'];
    for (let i = 0; i < defaultSections.length; i++) {
      await db.query(
        'INSERT INTO sections (name, project_id, position) VALUES ($1, $2, $3)',
        [defaultSections[i], project.id, i]
      );
    }

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project details
router.get('/:id', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(404).json({ error: 'Invalid project ID format' });
    }

    // Check if user has access
    const accessCheck = await db.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2
       UNION
       SELECT 1 FROM projects p
       INNER JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
       WHERE p.id = $1 AND wm.user_id = $2 AND p.is_public = true
       UNION
       SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2`,
      [id, req.userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const project = await db.query(
      `SELECT p.*, 
              u.name as owner_name,
              t.name as team_name,
              w.name as workspace_name,
              COUNT(DISTINCT tk.id) as task_count,
              COUNT(DISTINCT tk.id) FILTER (WHERE tk.status = 'completed') as completed_task_count,
              COUNT(DISTINCT pm.user_id) as member_count
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN workspaces w ON p.workspace_id = w.id
       LEFT JOIN tasks tk ON p.id = tk.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1
       GROUP BY p.id, u.name, t.name, w.name`,
      [id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Update project
router.put('/:id', authMiddleware, [
  param('id').isUUID(),
  body('name').optional().trim(),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'archived', 'on_hold']),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim(),
  body('view_type').optional().isIn(['list', 'board', 'timeline', 'calendar']),
  body('is_public').optional().isBoolean(),
  body('due_date').optional().isISO8601(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, status, color, icon,
      view_type, is_public, due_date
    } = req.body;

    // Check if user is project owner or admin
    const accessCheck = await db.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2
       UNION
       SELECT 'owner' as role FROM projects WHERE id = $1 AND owner_id = $2`,
      [id, req.userId]
    );

    if (accessCheck.rows.length === 0 || !['owner', 'admin'].includes(accessCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Only project owner or admin can update' });
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
    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (color) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (view_type) {
      updates.push(`view_type = $${paramCount++}`);
      values.push(view_type);
    }
    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(is_public);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(due_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `
      UPDATE projects 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is project owner
    const ownerCheck = await db.query(
      'SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2',
      [id, req.userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only project owner can delete' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project sections
router.get('/:id/sections', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check access (reuse logic from above)
    const sections = await db.query(
      `SELECT s.*, COUNT(t.id) as task_count
       FROM sections s
       LEFT JOIN tasks t ON s.id = t.section_id
       WHERE s.project_id = $1
       GROUP BY s.id
       ORDER BY s.position`,
      [id]
    );

    res.json(sections.rows);
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Failed to get sections' });
  }
});

// Create section
router.post('/:id/sections', authMiddleware, [
  param('id').isUUID(),
  body('name').notEmpty().trim(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Get max position
    const maxPos = await db.query(
      'SELECT MAX(position) as max_pos FROM sections WHERE project_id = $1',
      [id]
    );

    const position = (maxPos.rows[0].max_pos || 0) + 1;

    const section = await db.query(
      'INSERT INTO sections (name, project_id, position) VALUES ($1, $2, $3) RETURNING *',
      [name, id, position]
    );

    res.status(201).json(section.rows[0]);
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// Get project members
router.get('/:id/members', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    const members = await db.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, pm.role, pm.joined_at
       FROM project_members pm
       INNER JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at`,
      [id]
    );

    res.json(members.rows);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ error: 'Failed to get project members' });
  }
});

// Add project member
router.post('/:id/members', authMiddleware, [
  param('id').isUUID(),
  body('user_id').isUUID(),
  body('role').optional().isIn(['member', 'admin']),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    // Check if already a member
    const existingMember = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [id, user_id, role]
    );

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

module.exports = router;
