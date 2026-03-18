const express = require('express');
const cors = require('cors');
const tasksRouter = require('./routes/tasks');
const subtasksRouter = require('./routes/subtasks');
const statusesRouter = require('./routes/statuses');
const tasksCtrl = require('./controllers/tasksController');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/tasks/:taskId/subtasks', subtasksRouter);
app.use('/api/statuses', statusesRouter);

// Dashboard routes
app.get('/api/dashboard/summary', tasksCtrl.getDashboardSummary);
app.get('/api/dashboard/week', tasksCtrl.getDashboardWeek);
app.get('/api/dashboard/trend', tasksCtrl.getDashboardTrend);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaskList server running on http://localhost:${PORT}`);
});

module.exports = app;
