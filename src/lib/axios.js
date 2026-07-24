import axios from 'axios';

const api = axios.create({
  baseURL: 'https://kartikey-mittal.app.n8n.cloud',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
