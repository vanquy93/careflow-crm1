import axios from 'axios';

// Tự động nhận diện môi trường:
// - Production (VPS): cùng domain, gọi /api/... qua Nginx proxy
// - Development (local): gọi trực tiếp localhost:3001
const isProduction = import.meta.env.PROD;
const API_URL = isProduction ? '' : `http://${window.location.hostname}:3001`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
