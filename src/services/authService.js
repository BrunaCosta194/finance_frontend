import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email: email,
      senha: password,  // ← backend espera 'senha', não 'password'
    });

    const token = response.data; // retorna string pura
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email }));
    return token;
  },

  async register(name, email, password) {
    const response = await api.post('/auth/register', {
      nome: name,       // ← backend espera 'nome', não 'name'
      email: email,
      senha: password,  // ← backend espera 'senha', não 'password'
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};