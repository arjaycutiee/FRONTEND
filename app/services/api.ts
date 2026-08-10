import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.22:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// We can add interceptors here later if we need to attach authentication tokens

export default api;
