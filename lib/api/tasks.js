import client from './client.js'

export const tasksApi = {
  getAll: (params = {}) =>
    client.get('/api/tasks', { params }).then((r) => r.data),

  getOne: (id) =>
    client.get(`/api/tasks/${id}`).then((r) => r.data),

  create: (data) =>
    client.post('/api/tasks', data).then((r) => r.data),

  update: (id, data) =>
    client.put(`/api/tasks/${id}`, data).then((r) => r.data),

  patch: (id, data) =>
    client.patch(`/api/tasks/${id}`, data).then((r) => r.data),

  toggle: (id) =>
    client.patch(`/api/tasks/${id}/toggle`).then((r) => r.data),

  delete: (id) =>
    client.delete(`/api/tasks/${id}`).then((r) => r.data),
}

export const customChartsApi = {
  getAll: () =>
    client.get('/api/custom-charts').then((r) => r.data),

  create: (data) =>
    client.post('/api/custom-charts', data).then((r) => r.data),

  update: (id, data) =>
    client.put(`/api/custom-charts/${id}`, data).then((r) => r.data),

  delete: (id) =>
    client.delete(`/api/custom-charts/${id}`).then((r) => r.data),
}

export const dashboardApi = {
  summary: () =>
    client.get('/api/dashboard/summary').then((r) => r.data),

  week: () =>
    client.get('/api/dashboard/week').then((r) => r.data),

  trend: () =>
    client.get('/api/dashboard/trend').then((r) => r.data),
}
