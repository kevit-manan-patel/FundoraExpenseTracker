import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://fundoraexpensetracker.onrender.com/api' : '/api');
const api = axios.create({ baseURL });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('fundora_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use((r) => r, (e) => {
  const url = e.config?.url || '';
  if (e.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/password')) {
    localStorage.removeItem('fundora_token');
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }
  return Promise.reject(e);
});

export const errMsg = (e) => e.response?.data?.message || (e.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : e.message) || 'Something went wrong';
export default api;
