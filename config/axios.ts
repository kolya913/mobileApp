import axios from 'axios';

export const API_BASE_URL = 'http://192.168.1.99:8080/api';
export const IMAGE_BASE_URL = 'http://192.168.1.99:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

export default api;
