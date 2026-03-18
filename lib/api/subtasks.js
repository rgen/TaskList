import client from './client.js'

export const subtasksApi = {
  getAll: (taskId) =>
    client.get(`/api/tasks/${taskId}/subtasks`).then((r) => r.data),

  create: (taskId, data) =>
    client.post(`/api/tasks/${taskId}/subtasks`, data).then((r) => r.data),

  update: (taskId, id, data) =>
    client.put(`/api/tasks/${taskId}/subtasks/${id}`, data).then((r) => r.data),

  delete: (taskId, id) =>
    client.delete(`/api/tasks/${taskId}/subtasks/${id}`).then((r) => r.data),
}

export const attachmentsApi = {
  create: (taskId, data) =>
    client.post(`/api/tasks/${taskId}/attachments`, data).then((r) => r.data),

  delete: (taskId, id) =>
    client.delete(`/api/tasks/${taskId}/attachments/${id}`).then((r) => r.data),
}
