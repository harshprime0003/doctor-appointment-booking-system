import api from './client.js';

export const DashboardApi = {
  get: () => api.get('/dashboard').then((r) => r.data),
};
