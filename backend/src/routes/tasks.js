const express = require('express');
const { body, param, query } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a project
router.get('/', authMiddleware, [
  query('project_id').optional().isUUID(),
  query('assignee_id').optional().isUUID(),
  query('status').optional().isIn(['todo', 'in_progress', 'completed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  validate
], async (req, res) => {
  try {
    const { project_id, assignee_id, status, priority } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (project_id) {
      whereConditions.push(`t.project_id = $${paramCount++}`);
      queryParams.push(project_id);
    }
    if (assignee_id) {
      whereConditions.push(`t.assignee_id = $${paramCount++}`);
      queryParams.push(assignee_id);
    }
    if (status) {
      whereConditions.push(`t.status = $${paramCount++}`);
      queryParams.push(status);
    }
    if (priority) {
      whereConditions.push(`t.priority = $${paramCount++}`);
      queryParams.push(priority);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const tasks = await db.query(
      `SELECT t.*,
              u.name as assignee_name,
              u.avatar_url as assignee_avatar,
              c.name as created_by_name,
              s.name as section_name,
              p.name as project_name,
              COUNT(DISTINCT st.id) as subtask_count,
              COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'completed') as completed_subtask_count,
              COUNT(DISTINCT cm.id) as comment_count,
              COUNT(DISTINCT at.id) as attachment_count,
              array_agg(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL) as tags
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users c ON t.created_by = c.id
       LEFT JOIN sections s ON t.section_id = s.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN tasks st ON t.id = st.parent_task_id
       LEFT JOIN comments cm ON t.id = cm.task_id
       LEFT JOIN attachments at ON t.id = at.task_id
       LEFT JOIN task_tags tt ON t.id = tt.task_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       ${whereClause}
       GROUP BY t.id, u.name, u.avatar_url, c.name, s.name, p.name
       ORDER BY t.position, t.created_at DESC`,
      queryParams
    );

    res.json(tasks.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create a new task
router.post('/', authMiddleware, [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('project_id').isUUID(),
  body('section_id').optional().isUUID(),
  body('assignee_id').optional().isUUID(),
  body('parent_task_id').optional().isUUID(),
  body('status').optional().isIn(['todo', 'in_progress', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('due_date').optional().isISO8601(),
  body('start_date').optional().isISO8601(),
  body('is_milestone').optional().isBoolean(),
  body('tags').optional().isArray(),
  validate
], async (req, res) => {
  try {
    const {
      title, description, project_id, section_id, assignee_id,
      parent_task_id, status, priority, due_date, start_date,
      is_milestone, tags
    } = req.body;

    // Get position for the task
    let position = 0;
    if (section_id) {
      const maxPos = await db.query(
        'SELECT MAX(position) as max_pos FROM tasks WHERE section_id = $1',
        [section_id]
      );
      position = (maxPos.rows[0].max_pos || 0) + 1;
    } else {
      const maxPos = await db.query(
        'SELECT MAX(position) as max_pos FROM tasks WHERE project_id = $1 AND section_id IS NULL',
        [project_id]
      );
      position = (maxPos.rows[0].max_pos || 0) + 1;
    }

    // Create task
    const taskResult = await db.query(
      `INSERT INTO tasks (
        title, description, project_id, section_id, assignee_id,
        created_by, parent_task_id, status, priority, due_date,
        start_date, position, is_milestone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title, description, project_id, section_id, assignee_id,
        req.userId, parent_task_id, status || 'todo', priority || 'medium',
        due_date, start_date, position, is_milestone || false
      ]
    );

    const task = taskResult.rows[0];

    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        const tagResult = await db.query(
          `INSERT INTO tags (name, workspace_id, created_by)
           SELECT $1, p.workspace_id, $2
           FROM projects p WHERE p.id = $3
           ON CONFLICT (name, workspace_id) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tagName, req.userId, project_id]
        );

        // Link tag to task
        await db.query(
          'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
          [task.id, tagResult.rows[0].id]
        );
      }
    }

    // Add creator as follower
    await db.query(
      'INSERT INTO task_followers (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [task.id, req.userId]
    );

    // Create activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, action, details, user_id, workspace_id)
       SELECT 'task', $1, 'created', $2, $3, p.workspace_id
       FROM projects p WHERE p.id = $4`,
      [task.id, JSON.stringify({ title }), req.userId, project_id]
    );

    // Send notification to assignee if different from creator
    if (assignee_id && assignee_id !== req.userId) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'task_assigned', 'New task assigned', $2, 'task', $3)`,
        [assignee_id, `You have been assigned to: ${title}`, task.id]
      );
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get task details
router.get('/:id', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    const task = await db.query(
      `SELECT t.*,
              u.name as assignee_name,
              u.avatar_url as assignee_avatar,
              c.name as created_by_name,
              s.name as section_name,
              p.name as project_name,
              pt.title as parent_task_title,
              array_agg(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL) as tags,
              array_agg(DISTINCT jsonb_build_object(
                'id', tf.user_id,
                'name', fu.name,
                'avatar_url', fu.avatar_url
              )) FILTER (WHERE tf.user_id IS NOT NULL) as followers
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users c ON t.created_by = c.id
       LEFT JOIN sections s ON t.section_id = s.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN tasks pt ON t.parent_task_id = pt.id
       LEFT JOIN task_tags tt ON t.id = tt.task_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       LEFT JOIN task_followers tf ON t.id = tf.task_id
       LEFT JOIN users fu ON tf.user_id = fu.id
       WHERE t.id = $1
       GROUP BY t.id, u.name, u.avatar_url, c.name, s.name, p.name, pt.title`,
      [id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get subtasks
    const subtasks = await db.query(
      `SELECT t.*, u.name as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = $1
       ORDER BY t.position`,
      [id]
    );

    // Get dependencies
    const dependencies = await db.query(
      `SELECT dt.*, td.depends_on_task_id
       FROM task_dependencies td
       INNER JOIN tasks dt ON td.depends_on_task_id = dt.id
       WHERE td.task_id = $1`,
      [id]
    );

    const taskData = task.rows[0];
    taskData.subtasks = subtasks.rows;
    taskData.dependencies = dependencies.rows;

    res.json(taskData);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Update task
router.put('/:id', authMiddleware, [
  param('id').isUUID(),
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('section_id').optional().isUUID(),
  body('assignee_id').optional().isUUID(),
  body('status').optional().isIn(['todo', 'in_progress', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('due_date').optional().isISO8601(),
  body('start_date').optional().isISO8601(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, section_id, assignee_id,
      status, priority, due_date, start_date
    } = req.body;

    // Get current task state for comparison
    const currentTask = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (currentTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (section_id !== undefined) {
      updates.push(`section_id = $${paramCount++}`);
      values.push(section_id);
    }
    if (assignee_id !== undefined) {
      updates.push(`assignee_id = $${paramCount++}`);
      values.push(assignee_id);
    }
    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
      
      if (status === 'completed' && currentTask.rows[0].status !== 'completed') {
        updates.push(`completed_at = $${paramCount++}`);
        values.push(new Date());
        updates.push(`completed_by = $${paramCount++}`);
        values.push(req.userId);
      } else if (status !== 'completed' && currentTask.rows[0].status === 'completed') {
        updates.push(`completed_at = $${paramCount++}`);
        values.push(null);
        updates.push(`completed_by = $${paramCount++}`);
        values.push(null);
      }
    }
    if (priority) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(due_date);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(start_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `
      UPDATE tasks 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    // Create activity
    const changes = {};
    if (status && status !== currentTask.rows[0].status) changes.status = { from: currentTask.rows[0].status, to: status };
    if (assignee_id !== undefined && assignee_id !== currentTask.rows[0].assignee_id) changes.assignee = { from: currentTask.rows[0].assignee_id, to: assignee_id };

    if (Object.keys(changes).length > 0) {
      await db.query(
        `INSERT INTO activities (entity_type, entity_id, action, details, user_id, workspace_id)
         SELECT 'task', $1, 'updated', $2, $3, p.workspace_id
         FROM tasks t
         INNER JOIN projects p ON t.project_id = p.id
         WHERE t.id = $1`,
        [id, JSON.stringify(changes), req.userId]
      );
    }

    // Send notification to new assignee
    if (assignee_id && assignee_id !== currentTask.rows[0].assignee_id && assignee_id !== req.userId) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'task_assigned', 'Task assigned to you', $2, 'task', $3)`,
        [assignee_id, `You have been assigned to: ${title || currentTask.rows[0].title}`, id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Add comment to task
router.post('/:id/comments', authMiddleware, [
  param('id').isUUID(),
  body('content').notEmpty().trim(),
  body('parent_comment_id').optional().isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_comment_id } = req.body;

    const comment = await db.query(
      `INSERT INTO comments (content, task_id, user_id, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [content, id, req.userId, parent_comment_id]
    );

    // Create activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, action, details, user_id, workspace_id)
       SELECT 'task', $1, 'commented', $2, $3, p.workspace_id
       FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [id, JSON.stringify({ comment: content }), req.userId]
    );

    // Notify task followers
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
       SELECT tf.user_id, 'task_comment', 'New comment on task', $1, 'task', $2
       FROM task_followers tf
       WHERE tf.task_id = $2 AND tf.user_id != $3`,
      [`New comment on task you're following`, id, req.userId]
    );

    res.status(201).json(comment.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get task comments
router.get('/:id/comments', authMiddleware, [
  param('id').isUUID(),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await db.query(
      `SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json(comments.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Move task to different section or position
router.put('/:id/move', authMiddleware, [
  param('id').isUUID(),
  body('section_id').optional().isUUID(),
  body('position').isInt({ min: 0 }),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { section_id, position } = req.body;

    // Update positions of other tasks
    if (section_id) {
      // Moving to a different section
      await db.query(
        `UPDATE tasks 
         SET position = position + 1
         WHERE section_id = $1 AND position >= $2`,
        [section_id, position]
      );
    } else {
      // Moving within the same project
      const currentTask = await db.query('SELECT project_id FROM tasks WHERE id = $1', [id]);
      await db.query(
        `UPDATE tasks 
         SET position = position + 1
         WHERE project_id = $1 AND section_id IS NULL AND position >= $2`,
        [currentTask.rows[0].project_id, position]
      );
    }

    // Update the task
    const result = await db.query(
      `UPDATE tasks 
       SET section_id = $1, position = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [section_id, position, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

module.exports = router;
