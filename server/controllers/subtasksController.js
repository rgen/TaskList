const db = require('../db');

function toBoolean(val) {
  return val === 1 || val === true;
}

// GET /api/tasks/:taskId/subtasks
function getSubtasks(req, res, next) {
  try {
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.taskId);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(req.params.taskId);
    subtasks.forEach(s => { s.completed = toBoolean(s.completed); });
    res.json(subtasks);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:taskId/subtasks
function createSubtask(req, res, next) {
  try {
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.taskId);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const { name } = req.body;
    if (!name || name.trim() === '') {
      const err = new Error('name is required');
      err.status = 400;
      return next(err);
    }

    const info = db.prepare(
      'INSERT INTO subtasks (task_id, name, completed) VALUES (?, ?, 0)'
    ).run(req.params.taskId, name.trim());

    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(info.lastInsertRowid);
    subtask.completed = toBoolean(subtask.completed);
    res.status(201).json(subtask);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:taskId/subtasks/:id
function updateSubtask(req, res, next) {
  try {
    const subtask = db.prepare(
      'SELECT * FROM subtasks WHERE id = ? AND task_id = ?'
    ).get(req.params.id, req.params.taskId);

    if (!subtask) {
      const err = new Error('Subtask not found');
      err.status = 404;
      return next(err);
    }

    const { name, completed } = req.body;
    const newName = name !== undefined ? name.trim() : subtask.name;
    const newCompleted = completed !== undefined ? (completed ? 1 : 0) : subtask.completed;

    db.prepare(
      'UPDATE subtasks SET name = ?, completed = ? WHERE id = ?'
    ).run(newName, newCompleted, subtask.id);

    const updated = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtask.id);
    updated.completed = toBoolean(updated.completed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:taskId/subtasks/:id
function deleteSubtask(req, res, next) {
  try {
    const subtask = db.prepare(
      'SELECT * FROM subtasks WHERE id = ? AND task_id = ?'
    ).get(req.params.id, req.params.taskId);

    if (!subtask) {
      const err = new Error('Subtask not found');
      err.status = 404;
      return next(err);
    }

    db.prepare('DELETE FROM subtasks WHERE id = ?').run(subtask.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:taskId/attachments
function createAttachment(req, res, next) {
  try {
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.taskId);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const { label, url } = req.body;
    if (!url || url.trim() === '') {
      const err = new Error('url is required');
      err.status = 400;
      return next(err);
    }

    const info = db.prepare(
      'INSERT INTO attachments (task_id, label, url) VALUES (?, ?, ?)'
    ).run(req.params.taskId, label || null, url.trim());

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:taskId/attachments/:id
function deleteAttachment(req, res, next) {
  try {
    const attachment = db.prepare(
      'SELECT * FROM attachments WHERE id = ? AND task_id = ?'
    ).get(req.params.id, req.params.taskId);

    if (!attachment) {
      const err = new Error('Attachment not found');
      err.status = 404;
      return next(err);
    }

    db.prepare('DELETE FROM attachments WHERE id = ?').run(attachment.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createAttachment,
  deleteAttachment,
};
