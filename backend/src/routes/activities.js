const express = require('express');
const { query } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get activities for a workspace
router.get('/', authMiddleware, [
  query('workspace_id').optional().isUUID(),
  query('entity_type').optional().isIn(['task', 'project', 'workspace']),
  query('entity_id').optional().isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req, res) => {
  try {
    const { 
      workspace_id, 
      entity_type, 
      entity_id,
      limit = 50,
      offset = 0
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (workspace_id) {
      whereConditions.push(`a.workspace_id = $${paramCount++}`);
      queryParams.push(workspace_id);
    }
    if (entity_type) {
      whereConditions.push(`a.entity_type = $${paramCount++}`);
      queryParams.push(entity_type);
    }
    if (entity_id) {
      whereConditions.push(`a.entity_id = $${paramCount++}`);
      queryParams.push(entity_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    queryParams.push(limit);
    queryParams.push(offset);

    const activities = await db.query(
      `SELECT a.*, u.name as user_name, u.avatar_url as user_avatar
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      queryParams
    );

    res.json(activities.rows);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Get activity feed for current user
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const activities = await db.query(
      `SELECT DISTINCT a.*, u.name as user_name, u.avatar_url as user_avatar
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.workspace_id IN (
         SELECT workspace_id FROM workspace_members WHERE user_id = $1
       )
       OR a.entity_id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       )
       OR a.entity_id IN (
         SELECT task_id FROM task_followers WHERE user_id = $1
       )
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [req.userId]
    );

    res.json(activities.rows);
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
});

module.exports = router;
