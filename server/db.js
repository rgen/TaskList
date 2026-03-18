const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tasks.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const tasksTableExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
).get();

const customStatusesExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='custom_statuses'"
).get();

if (!tasksTableExists) {
  // Fresh install — create all tables without CHECK constraint on status
  db.exec(`
    CREATE TABLE tasks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      notes         TEXT,
      status        TEXT    NOT NULL DEFAULT 'pending',
      priority      TEXT    NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      due_date      TEXT,
      duration      INTEGER,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      completed_at  TEXT,
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE subtasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE attachments (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label    TEXT,
      url      TEXT    NOT NULL
    );

    CREATE TABLE custom_statuses (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6b7280'
    );
  `);
} else if (!customStatusesExists) {
  // Migration: drop CHECK constraint on status + add custom_statuses table
  db.transaction(() => {
    db.exec(`
      CREATE TABLE tasks_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT    NOT NULL,
        notes         TEXT,
        status        TEXT    NOT NULL DEFAULT 'pending',
        priority      TEXT    NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
        due_date      TEXT,
        duration      INTEGER,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
        completed_at  TEXT,
        updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`INSERT INTO tasks_new SELECT * FROM tasks`);
    db.exec(`DROP TABLE tasks`);
    db.exec(`ALTER TABLE tasks_new RENAME TO tasks`);
    db.exec(`
      CREATE TABLE custom_statuses (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        name  TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#6b7280'
      );
    `);
  })();

  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label    TEXT,
      url      TEXT    NOT NULL
    );
  `);
}

module.exports = db;
