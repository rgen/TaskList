import client from './client.js'

export const gcalApi = {
  getStatus: () =>
    client.get('/api/gcal/status').then((r) => r.data),

  getConnectUrl: () =>
    client.get('/api/gcal/connect').then((r) => r.data),

  disconnect: () =>
    client.post('/api/gcal/disconnect').then((r) => r.data),

  getCalendars: () =>
    client.get('/api/gcal/calendars').then((r) => r.data),

  selectCalendar: (data) =>
    client.put('/api/gcal/calendars', data).then((r) => r.data),

  syncTask: (taskId) =>
    client.post('/api/gcal/sync', { taskId }).then((r) => r.data),

  unsyncTask: (taskId) =>
    client.delete(`/api/gcal/sync?taskId=${taskId}`).then((r) => r.data),
}
