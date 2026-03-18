const db = require('../db');

function toBoolean(val) {
  return val === 1 || val === true;
}

function addIsOverdue(task) {
  const today = new Date().toISOString().slice(0, 10);
  task.is_overdue =
    task.due_date !== null &&
    task.due_date !== undefined &&
    task.due_date < today &&
    task.status === 'pending';
  return task;
}

// GET /api/tasks
function getAll(req, res, next) {
  try {
    const { status, priority, sort = 'created_at', order = 'desc' } = req.query;

    const validSortCols = ['created_at', 'updated_at', 'due_date', 'priority', 'name', 'status'];
    const validOrders = ['asc', 'desc'];
    const sortCol = validSortCols.includes(sort) ? sort : 'created_at';
    const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM tasks ${where} ORDER BY ${sortCol} ${sortOrder}`;

    const tasks = db.prepare(sql).all(...params);
    const result = tasks.map(addIsOverdue);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id
function getOne(req, res, next) {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(task.id);
    const attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ?').all(task.id);

    subtasks.forEach(s => { s.completed = toBoolean(s.completed); });

    addIsOverdue(task);
    task.subtasks = subtasks;
    task.attachments = attachments;

    res.json(task);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks
function createTask(req, res, next) {
  try {
    const { name, notes, status, priority, due_date, duration } = req.body;

    if (!name || name.trim() === '') {
      const err = new Error('name is required');
      err.status = 400;
      return next(err);
    }

    const stmt = db.prepare(`
      INSERT INTO tasks (name, notes, status, priority, due_date, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      name.trim(),
      notes || null,
      status || 'pending',
      priority || 'medium',
      due_date || null,
      duration || null
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    addIsOverdue(task);
    task.subtasks = [];
    task.attachments = [];

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
function updateTask(req, res, next) {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const { name, notes, status, priority, due_date, duration } = req.body;

    if (!name || name.trim() === '') {
      const err = new Error('name is required');
      err.status = 400;
      return next(err);
    }

    let completed_at = existing.completed_at;
    if (status === 'completed' && existing.status !== 'completed') {
      completed_at = new Date().toISOString();
    } else if (status === 'pending') {
      completed_at = null;
    }

    db.prepare(`
      UPDATE tasks
      SET name = ?, notes = ?, status = ?, priority = ?, due_date = ?, duration = ?,
          completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name.trim(),
      notes || null,
      status || existing.status,
      priority || existing.priority,
      due_date || null,
      duration || null,
      completed_at,
      req.params.id
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(task.id);
    const attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ?').all(task.id);

    subtasks.forEach(s => { s.completed = toBoolean(s.completed); });
    addIsOverdue(task);
    task.subtasks = subtasks;
    task.attachments = attachments;

    res.json(task);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id/toggle
function toggleTask(req, res, next) {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const completed_at = newStatus === 'completed' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE tasks
      SET status = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, completed_at, task.id);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
    addIsOverdue(updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
function deleteTask(req, res, next) {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/summary
function getDashboardSummary(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count;
    const overdue = db.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ?"
    ).get(today).count;

    const high = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high'").get().count;
    const medium = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'medium'").get().count;
    const low = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'low'").get().count;

    res.json({
      total,
      completed,
      pending,
      overdue,
      byPriority: { high, medium, low },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/week
function getDashboardWeek(req, res, next) {
  try {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = db.prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE due_date = ?"
      ).get(date).count;
      days.push({ date, day, count });
    }
    res.json(days);
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/trend
function getDashboardTrend(req, res, next) {
  try {
    const rows = db.prepare(`
      SELECT date(completed_at) as date, COUNT(*) as count
      FROM tasks
      WHERE completed_at IS NOT NULL
        AND completed_at >= datetime('now', '-30 days')
      GROUP BY date(completed_at)
      ORDER BY date ASC
    `).all();

    // Fill in missing days
    const map = {};
    rows.forEach(r => { map[r.date] = r.count; });

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      result.push({ date, count: map[date] || 0 });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getOne,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  getDashboardSummary,
  getDashboardWeek,
  getDashboardTrend,
};
