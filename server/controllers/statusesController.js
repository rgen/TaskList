const db = require('../db');

// GET /api/statuses
function getAll(req, res, next) {
  try {
    const statuses = db.prepare('SELECT * FROM custom_statuses ORDER BY id ASC').all();
    res.json(statuses);
  } catch (err) {
    next(err);
  }
}

// POST /api/statuses
function createStatus(req, res, next) {
  try {
    const { name, color } = req.body;
    if (!name || name.trim() === '') {
      const err = new Error('name is required');
      err.status = 400;
      return next(err);
    }

    const trimmed = name.trim();

    // Reject names that conflict with built-in statuses
    if (['pending', 'completed'].includes(trimmed.toLowerCase())) {
      const err = new Error(`"${trimmed}" is a built-in status and cannot be added`);
      err.status = 400;
      return next(err);
    }

    const stmt = db.prepare(
      'INSERT INTO custom_statuses (name, color) VALUES (?, ?)'
    );
    const info = stmt.run(trimmed, color || '#6b7280');
    const created = db.prepare('SELECT * FROM custom_statuses WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      const conflict = new Error('A status with that name already exists');
      conflict.status = 409;
      return next(conflict);
    }
    next(err);
  }
}

// DELETE /api/statuses/:id
function deleteStatus(req, res, next) {
  try {
    const status = db.prepare('SELECT * FROM custom_statuses WHERE id = ?').get(req.params.id);
    if (!status) {
      const err = new Error('Status not found');
      err.status = 404;
      return next(err);
    }
    db.prepare('DELETE FROM custom_statuses WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, createStatus, deleteStatus };
