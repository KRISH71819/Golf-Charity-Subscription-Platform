import api from '../services/api'

export const adminApi = {
  getSession: () => api.get('/admin/session'),
  getAnalytics: () => api.get('/admin/analytics'),

  listUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
  listUserScores: (userId) => api.get(`/admin/users/${userId}/scores`),
  createUserScore: (userId, payload) => api.post(`/admin/users/${userId}/scores`, payload),
  updateScore: (scoreId, payload) => api.patch(`/admin/scores/${scoreId}`, payload),
  deleteScore: (scoreId) => api.delete(`/admin/scores/${scoreId}`),

  listDraws: () => api.get('/admin/draws'),
  createDraw: (payload) => api.post('/admin/draws', payload),
  updateDraw: (id, payload) => api.patch(`/admin/draws/${id}`, payload),
  simulateDraw: (id, payload) => api.post(`/admin/draws/${id}/simulate`, payload),
  publishDraw: (id) => api.post(`/admin/draws/${id}/publish`),

  listCharities: () => api.get('/admin/charities'),
  createCharity: (payload) => api.post('/admin/charities', payload),
  updateCharity: (id, payload) => api.patch(`/admin/charities/${id}`, payload),
  deleteCharity: (id) => api.delete(`/admin/charities/${id}`),

  listWinners: (params) => api.get('/admin/winners', { params }),
  updateWinner: (id, payload) => api.patch(`/admin/winners/${id}`, payload),
}

export function getErrorMessage(error, fallback = 'Something went wrong.') {
  return error?.response?.data?.error || error?.message || fallback
}
