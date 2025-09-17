const express = require('express');
const { query } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Global search
router.get('/', authMiddleware, [
  query('q').notEmpty().trim(),
  query('type').optional().isIn(['all', 'tasks', 'projects', 'users', 'teams']),
  query('workspace_id').optional().isUUID(),
  validate
], async (req, res) => {
  try {
    const { q, type = 'all', workspace_id } = req.query;
    const searchTerm = `%${q}%`;
    const results = {};

    // Search tasks
    if (type === 'all' || type === 'tasks') {
      let taskQuery = `
        SELECT t.id, t.title, t.description, t.status, p.name as project_name
        FROM tasks t
        INNER JOIN projects p ON t.project_id = p.id
        WHERE (t.title ILIKE $1 OR t.description ILIKE $1)
        AND (
          t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $2)
          OR t.assignee_id = $2
          OR t.created_by = $2
        )
      `;
      let taskParams = [searchTerm, req.userId];

      if (workspace_id) {
        taskQuery += ' AND p.workspace_id = $3';
        taskParams.push(workspace_id);
      }

      taskQuery += ' LIMIT 10';
      const tasks = await db.query(taskQuery, taskParams);
      results.tasks = tasks.rows;
    }

    // Search projects
    if (type === 'all' || type === 'projects') {
      let projectQuery = `
        SELECT p.id, p.name, p.description, w.name as workspace_name
        FROM projects p
        INNER JOIN workspaces w ON p.workspace_id = w.id
        WHERE (p.name ILIKE $1 OR p.description ILIKE $1)
        AND (
          p.id IN (SELECT project_id FROM project_members WHERE user_id = $2)
          OR p.owner_id = $2
          OR p.is_public = true
        )
      `;
      let projectParams = [searchTerm, req.userId];

      if (workspace_id) {
        projectQuery += ' AND p.workspace_id = $3';
        projectParams.push(workspace_id);
      }

      projectQuery += ' LIMIT 10';
      const projects = await db.query(projectQuery, projectParams);
      results.projects = projects.rows;
    }

    // Search users
    if (type === 'all' || type === 'users') {
      let userQuery = `
        SELECT DISTINCT u.id, u.name, u.email, u.avatar_url
        FROM users u
        WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
      `;
      let userParams = [searchTerm];

      if (workspace_id) {
        userQuery += `
          AND u.id IN (
            SELECT user_id FROM workspace_members WHERE workspace_id = $2
          )
        `;
        userParams.push(workspace_id);
      } else {
        userQuery += `
          AND u.id IN (
            SELECT user_id FROM workspace_members WHERE workspace_id IN (
              SELECT workspace_id FROM workspace_members WHERE user_id = $2
            )
          )
        `;
        userParams.push(req.userId);
      }

      userQuery += ' LIMIT 10';
      const users = await db.query(userQuery, userParams);
      results.users = users.rows;
    }

    // Search teams
    if (type === 'all' || type === 'teams') {
      let teamQuery = `
        SELECT t.id, t.name, t.description, w.name as workspace_name
        FROM teams t
        INNER JOIN workspaces w ON t.workspace_id = w.id
        WHERE (t.name ILIKE $1 OR t.description ILIKE $1)
      `;
      let teamParams = [searchTerm];

      if (workspace_id) {
        teamQuery += ' AND t.workspace_id = $2';
        teamParams.push(workspace_id);
      } else {
        teamQuery += `
          AND t.workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = $2
          )
        `;
        teamParams.push(req.userId);
      }

      teamQuery += ' LIMIT 10';
      const teams = await db.query(teamQuery, teamParams);
      results.teams = teams.rows;
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Quick search suggestions
router.get('/suggestions', authMiddleware, [
  query('q').notEmpty().trim(),
  validate
], async (req, res) => {
  try {
    const { q } = req.query;
    const searchTerm = `${q}%`; // Prefix match for suggestions

    // Get task suggestions
    const taskSuggestions = await db.query(
      `SELECT title as label, 'task' as type, id
       FROM tasks
       WHERE title ILIKE $1
       AND (
         assignee_id = $2
         OR created_by = $2
         OR project_id IN (SELECT project_id FROM project_members WHERE user_id = $2)
       )
       LIMIT 5`,
      [searchTerm, req.userId]
    );

    // Get project suggestions
    const projectSuggestions = await db.query(
      `SELECT name as label, 'project' as type, id
       FROM projects
       WHERE name ILIKE $1
       AND (
         owner_id = $2
         OR id IN (SELECT project_id FROM project_members WHERE user_id = $2)
       )
       LIMIT 5`,
      [searchTerm, req.userId]
    );

    const allSuggestions = [...taskSuggestions.rows, ...projectSuggestions.rows];
    res.json(allSuggestions);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get search suggestions' });
  }
});

module.exports = router;
