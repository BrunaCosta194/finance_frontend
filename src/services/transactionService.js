import api from './api';

export const transactionService = {
  async create({ monthId, categoryId, description, amount, type, date }) {
    const response = await api.post('/transactions', null, {
      params: {
        monthId,
        categoryId,
        description,
        amount,
        type,
        date,
      },
    });
    return response.data;
  },
};
