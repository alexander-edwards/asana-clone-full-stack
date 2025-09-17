const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const db = require('../db');
const validate = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('organizationName').optional().trim(),
  validate
], async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create organization if provided
    let organizationId = null;
    if (organizationName) {
      const orgResult = await db.query(
        'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
        [organizationName]
      );
      organizationId = orgResult.rows[0].id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, name, organization_id, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, organization_id, role`,
      [email, hashedPassword, name, organizationId, organizationId ? 'admin' : 'member']
    );

    const user = userResult.rows[0];

    // Create default workspace if new organization
    if (organizationId) {
      const workspaceResult = await db.query(
        'INSERT INTO workspaces (name, organization_id, created_by) VALUES ($1, $2, $3) RETURNING id',
        [`${organizationName} Workspace`, organizationId, user.id]
      );
      
      // Add user to workspace
      await db.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspaceResult.rows[0].id, user.id, 'admin']
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, organizationId: user.organization_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await db.query(
      'SELECT id, email, password_hash, name, organization_id, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, organizationId: user.organization_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await db.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.organization_id, u.role,
              o.name as organization_name
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, [
  body('name').optional().trim(),
  body('avatar_url').optional().isURL(),
  validate
], async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (avatar_url) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, name, avatar_url, organization_id, role
    `;

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
