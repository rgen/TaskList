import client from './client.js'

export const getStatuses = () => client.get('/api/statuses').then(r => r.data)
export const createStatus = (data) => client.post('/api/statuses', data).then(r => r.data)
export const updateStatus = ({ id, ...data }) => client.put(`/api/statuses/${id}`, data).then(r => r.data)
export const deleteStatus = (id) => client.delete(`/api/statuses/${id}`).then(r => r.data)
