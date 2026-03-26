import client from './client.js'

export const gmailApi = {
  getStatus: () =>
    client.get('/api/gmail/status').then((r) => r.data),

  getConnectUrl: () =>
    client.get('/api/gmail/connect').then((r) => r.data),

  importEmails: () =>
    client.post('/api/gmail/import').then((r) => r.data),

  disconnect: () =>
    client.post('/api/gmail/disconnect').then((r) => r.data),
}
