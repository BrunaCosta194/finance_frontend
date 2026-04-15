import api from './api';

export const categoryService = {
  async getAll() {
    const response = await api.get('/categories');
    return response.data;
  },

  async create({ name, type }) {
    const response = await api.post('/categories', { name, type });
    return response.data;
  },
};