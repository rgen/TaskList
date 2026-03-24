import client from './client.js'

export const categoriesApi = {
  getAll: () => client.get('/api/categories').then((r) => r.data),
  create: (name) => client.post('/api/categories', { name }).then((r) => r.data),
  update: (id, name) => client.put(`/api/categories/${id}`, { name }).then((r) => r.data),
  delete: (id) => client.delete(`/api/categories/${id}`).then((r) => r.data),
  createSubcategory: (categoryId, name) =>
    client.post(`/api/categories/${categoryId}/subcategories`, { name }).then((r) => r.data),
  updateSubcategory: (id, name) =>
    client.put(`/api/subcategories/${id}`, { name }).then((r) => r.data),
  deleteSubcategory: (id) =>
    client.delete(`/api/subcategories/${id}`).then((r) => r.data),
}
