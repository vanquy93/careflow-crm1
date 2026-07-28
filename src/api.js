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
