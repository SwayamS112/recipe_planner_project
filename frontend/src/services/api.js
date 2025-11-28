// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// attach token to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // ensure header removed if no token
    if (config.headers) delete config.headers.Authorization;
  }
  return config;
}, (err) => Promise.reject(err));

export function setAuthToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');

  // Do NOT rely solely on API.defaults.headers here — interceptor handles it.
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
}

export const createItemList = (data) => API.post('/items', data).then(res => res.data);
export const getItemLists = () => API.get('/items').then(res => res.data);
export const toggleItemObtained = (listId, itemId) =>
  API.patch(`/items/${listId}/item/${itemId}/toggle`).then(res => res.data);
export const markListDone = (listId) =>
  API.patch(`/items/${listId}/done`).then(res => res.data);

export default API;
