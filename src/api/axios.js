import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tokenOk = token && token !== 'undefined' && token !== 'null';
  if (tokenOk) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      const hadToken = !!(token && token !== 'undefined' && token !== 'null');
      const url = String(error.config?.url || '');
      const isAuthCall =
        url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');

      if (hadToken && !isAuthCall) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;