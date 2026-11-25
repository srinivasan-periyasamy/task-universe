const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'todos.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ DB error:', err.message);
  else console.log('✅ Database connected');
});

db.serialize(() => {

  // ── USERS ──────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    color      TEXT    DEFAULT '#FF6B6B',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── TASKS ──────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    title        TEXT    NOT NULL,
    description  TEXT    DEFAULT '',
    category     TEXT    DEFAULT 'personal',
    status       TEXT    DEFAULT 'pending',
    priority     TEXT    DEFAULT 'medium',
    alarm_date   TEXT    DEFAULT NULL,
    alarm_time   TEXT    DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── SUBTASKS ───────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS subtasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    status     TEXT    DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);

  // ── RECURRING TASK TEMPLATES ───────────────
  db.run(`CREATE TABLE IF NOT EXISTS recurring_tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    category   TEXT    DEFAULT 'personal',
    priority   TEXT    DEFAULT 'medium',
    times      TEXT    DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── RECURRING DAILY LOG ────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS recurring_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    recurring_id INTEGER NOT NULL,
    user_id      INTEGER NOT NULL,
    log_date     TEXT    NOT NULL,
    slot         TEXT    DEFAULT 'done',
    done_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(recurring_id) REFERENCES recurring_tasks(id) ON DELETE CASCADE
  )`);

});

module.exports = db;
