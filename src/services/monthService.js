import api from './api';

export const monthService = {
  async getSummary(monthId) {
    const response = await api.get(`/months/${monthId}/summary`);
    return response.data;
  },

  async getTransactions(monthId) {
    const response = await api.get(`/months/${monthId}/transactions`);
    return response.data;
  },

  async getExpensesByCategory(monthId) {
    const response = await api.get(`/months/${monthId}/expenses-by-category`);
    return response.data;
  },
  async getCurrent() {
    const response = await api.get('/months/current');
    return response.data;
},
async getCurrent() {
    const response = await api.get('/months/current');
    return response.data;
},

async createCurrent({ month, year, monthlyIncome, savingsGoal }) {
    const response = await api.post('/months', null, {
        params: { month, year, monthlyIncome, savingsGoal }
    });
    return response.data;
},
};