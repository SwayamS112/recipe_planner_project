// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  // You can add default headers here if needed
});

export function setAuthToken(token) {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
}

// Item list endpoints
export const createItemList = (data) => API.post('/items', data).then(res => res.data);
export const getItemLists = () => API.get('/items').then(res => res.data);
export const toggleItemObtained = (listId, itemId) =>
  API.patch(`/items/${listId}/item/${itemId}/toggle`).then(res => res.data);
export const markListDone = (listId) =>
  API.patch(`/items/${listId}/done`).then(res => res.data);

// If your file uses default export, keep it; otherwise export above helpers alongside existing exports.
