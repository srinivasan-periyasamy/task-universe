// server.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const path       = require('path');
const db         = require('./database');

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

// ── MIDDLEWARE ───────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── AUTH MIDDLEWARE ──────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password, color } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const hash = await bcrypt.hash(password, 12);
    db.run(
      'INSERT INTO users (username, password, color) VALUES (?, ?, ?)',
      [username.trim(), hash, color || '#FF6B6B'],
      function (err) {
        if (err) return res.status(409).json({ error: 'Username already taken' });
        res.status(201).json({ message: '✅ Account created! Please login.' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  db.get('SELECT * FROM users WHERE username = ?', [username.trim()], async (err, user) => {
    if (!user) return res.status(401).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, color: user.color },
      SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, username: user.username, color: user.color, id: user.id });
  });
});

// GET ALL USERS (for team view)
app.get('/api/users', auth, (req, res) => {
  db.all('SELECT id, username, color, created_at FROM users', [], (err, rows) => {
    res.json(rows || []);
  });
});

// ════════════════════════════════════════════
//  TASK ROUTES
// ════════════════════════════════════════════

// GET ALL TASKS (everyone sees all)
app.get('/api/tasks', auth, (req, res) => {
  db.all(`
    SELECT
      tasks.*,
      users.username  AS owner,
      users.color     AS owner_color
    FROM tasks
    JOIN users ON tasks.user_id = users.id
    ORDER BY
      CASE tasks.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      tasks.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET STATS
app.get('/api/stats', auth, (req, res) => {
  db.all(`
    SELECT
      COUNT(*)                                          AS total,
      SUM(CASE WHEN status='pending'     THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN status='completed'   THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN category='personal'  THEN 1 ELSE 0 END) AS personal,
      SUM(CASE WHEN category='office'    THEN 1 ELSE 0 END) AS office,
      SUM(CASE WHEN category='education' THEN 1 ELSE 0 END) AS education
    FROM tasks
  `, [], (err, rows) => {
    res.json(rows[0] || {});
  });
});

// CREATE TASK
app.post('/api/tasks', auth, (req, res) => {
  const { title, description, category, priority, alarm_date, alarm_time } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  db.run(
    `INSERT INTO tasks
       (user_id, title, description, category, priority, alarm_date, alarm_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      title.trim(),
      description || '',
      category    || 'personal',
      priority    || 'medium',
      alarm_date  || null,
      alarm_time  || null
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: '✅ Task created!' });
    }
  );
});

// UPDATE TASK
app.put('/api/tasks/:id', auth, (req, res) => {
  const { title, description, category, priority, status, alarm_date, alarm_time } = req.body;
  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  db.run(
    `UPDATE tasks SET
       title=?, description=?, category=?, priority=?,
       status=?, alarm_date=?, alarm_time=?, completed_at=?
     WHERE id=? AND user_id=?`,
    [title, description, category, priority, status, alarm_date, alarm_time, completedAt, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not your task or not found' });
      res.json({ message: '✅ Task updated!' });
    }
  );
});

// DELETE TASK
app.delete('/api/tasks/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM tasks WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not your task or not found' });
      res.json({ message: '✅ Task deleted!' });
    }
  );
});

// ════════════════════════════════════════════
//  SUBTASK ROUTES
// ════════════════════════════════════════════

// GET SUBTASKS
app.get('/api/tasks/:id/subtasks', auth, (req, res) => {
  db.all(
    'SELECT * FROM subtasks WHERE task_id=? ORDER BY created_at ASC',
    [req.params.id],
    (err, rows) => res.json(rows || [])
  );
});

// ADD SUBTASK
app.post('/api/tasks/:id/subtasks', auth, (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.run(
    'INSERT INTO subtasks (task_id, title) VALUES (?, ?)',
    [req.params.id, title.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: '✅ Subtask added!' });
    }
  );
});

// UPDATE SUBTASK
app.put('/api/subtasks/:id', auth, (req, res) => {
  db.run(
    'UPDATE subtasks SET status=? WHERE id=?',
    [req.body.status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: '✅ Subtask updated!' });
    }
  );
});

// DELETE SUBTASK
app.delete('/api/subtasks/:id', auth, (req, res) => {
  db.run('DELETE FROM subtasks WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ Subtask deleted!' });
  });
});

// ── CATCH ALL → serve index.html ────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎯 ================================');
  console.log(`🚀  Task Universe running!`);
  console.log(`🌐  http://localhost:${PORT}`);
  console.log(`📱  http://192.168.0.101:${PORT}`);
  console.log('🎯 ================================');
  console.log('');
});