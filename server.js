require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── AUTH MIDDLEWARE ──────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════

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
        res.status(201).json({ message: 'Account created!' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

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

app.get('/api/users', auth, (req, res) => {
  db.all('SELECT id, username, color FROM users', [], (err, rows) => {
    res.json(rows || []);
  });
});

// ════════════════════════════════════════════
//  TASK ROUTES
// ════════════════════════════════════════════

app.get('/api/tasks', auth, (req, res) => {
  db.all(`
    SELECT tasks.*, users.username AS owner, users.color AS owner_color
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

app.post('/api/tasks', auth, (req, res) => {
  const { title, description, category, priority, alarm_date, alarm_time } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.run(
    `INSERT INTO tasks (user_id, title, description, category, priority, alarm_date, alarm_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, title.trim(), description || '', category || 'personal',
     priority || 'medium', alarm_date || null, alarm_time || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Task created!' });
    }
  );
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const { title, description, category, priority, status, alarm_date, alarm_time } = req.body;
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  db.run(
    `UPDATE tasks SET title=?, description=?, category=?, priority=?,
     status=?, alarm_date=?, alarm_time=?, completed_at=?
     WHERE id=? AND user_id=?`,
    [title, description, category, priority, status,
     alarm_date, alarm_time, completedAt, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not your task' });
      res.json({ message: 'Updated!' });
    }
  );
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  db.run('DELETE FROM tasks WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted!' });
    }
  );
});

// ════════════════════════════════════════════
//  SUBTASK ROUTES
// ════════════════════════════════════════════

app.get('/api/tasks/:id/subtasks', auth, (req, res) => {
  db.all('SELECT * FROM subtasks WHERE task_id=? ORDER BY created_at ASC',
    [req.params.id], (err, rows) => res.json(rows || []));
});

app.post('/api/tasks/:id/subtasks', auth, (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.run('INSERT INTO subtasks (task_id, title) VALUES (?, ?)',
    [req.params.id, title.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/subtasks/:id', auth, (req, res) => {
  db.run('UPDATE subtasks SET status=? WHERE id=?',
    [req.body.status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated!' });
    }
  );
});

app.delete('/api/subtasks/:id', auth, (req, res) => {
  db.run('DELETE FROM subtasks WHERE id=?', [req.params.id],
    (err) => res.json({ message: 'Deleted!' }));
});

// ════════════════════════════════════════════
//  RECURRING TASKS ROUTES
// ════════════════════════════════════════════

// Get all recurring templates
app.get('/api/recurring', auth, (req, res) => {
  db.all('SELECT * FROM recurring_tasks WHERE user_id=? ORDER BY created_at ASC',
    [req.user.id], (err, rows) => res.json(rows || []));
});

// Create recurring template
app.post('/api/recurring', auth, (req, res) => {
  const { title, category, priority, times } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.run(
    `INSERT INTO recurring_tasks (user_id, title, category, priority, times)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, title.trim(), category || 'personal',
     priority || 'medium', JSON.stringify(times || [])],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Recurring task created!' });
    }
  );
});

// Delete recurring template
app.delete('/api/recurring/:id', auth, (req, res) => {
  db.run('DELETE FROM recurring_tasks WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    (err) => res.json({ message: 'Deleted!' }));
});

// Get today's recurring log
app.get('/api/recurring/today', auth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  db.all(
    `SELECT rl.*, rt.title, rt.category, rt.priority, rt.times
     FROM recurring_log rl
     JOIN recurring_tasks rt ON rl.recurring_id = rt.id
     WHERE rl.user_id=? AND rl.log_date=?`,
    [req.user.id, today],
    (err, rows) => res.json(rows || [])
  );
});

// Check/uncheck recurring for today
app.post('/api/recurring/:id/toggle', auth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { slot } = req.body; // e.g. "morning", "afternoon", "evening" or just "done"
  db.get(
    'SELECT * FROM recurring_log WHERE recurring_id=? AND user_id=? AND log_date=? AND slot=?',
    [req.params.id, req.user.id, today, slot || 'done'],
    (err, row) => {
      if (row) {
        // Already done → undo
        db.run('DELETE FROM recurring_log WHERE id=?', [row.id],
          () => res.json({ status: 'undone' }));
      } else {
        // Mark done
        db.run(
          'INSERT INTO recurring_log (recurring_id, user_id, log_date, slot) VALUES (?,?,?,?)',
          [req.params.id, req.user.id, today, slot || 'done'],
          () => res.json({ status: 'done' })
        );
      }
    }
  );
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Task Universe running on http://localhost:${PORT}`);
});
