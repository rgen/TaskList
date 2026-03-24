import client from './client'

export const goalsApi = {
  getAll:      ()        => client.get('/api/goals').then(r => r.data),
  getProgress: ()        => client.get('/api/goals/progress').then(r => r.data),
  create:      (data)    => client.post('/api/goals', data).then(r => r.data),
  update:      (id,data) => client.put(`/api/goals/${id}`, data).then(r => r.data),
  delete:      (id)      => client.delete(`/api/goals/${id}`).then(r => r.data),
}
