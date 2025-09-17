import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://asana-backend-new-morphvm-s6un9i69.http.cloud.morph.so';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Workspace endpoints
export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  create: (data) => api.post('/workspaces', data),
  getById: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  getMembers: (id) => api.get(`/workspaces/${id}/members`),
  addMember: (id, data) => api.post(`/workspaces/${id}/members`, data),
  removeMember: (workspaceId, userId) => api.delete(`/workspaces/${workspaceId}/members/${userId}`),
};

// Project endpoints
export const projectAPI = {
  getAll: (workspaceId) => api.get('/projects', { params: { workspace_id: workspaceId } }),
  create: (data) => api.post('/projects', data),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getSections: (id) => api.get(`/projects/${id}/sections`),
  createSection: (id, data) => api.post(`/projects/${id}/sections`, data),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
};

// Task endpoints
export const taskAPI = {
  getAll: (filters) => api.get('/tasks', { params: filters }),
  create: (data) => api.post('/tasks', data),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  move: (id, data) => api.put(`/tasks/${id}/move`, data),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  getComments: (id) => api.get(`/tasks/${id}/comments`),
};

// Team endpoints
export const teamAPI = {
  getAll: (workspaceId) => api.get('/teams', { params: { workspace_id: workspaceId } }),
  create: (data) => api.post('/teams', data),
  getMembers: (id) => api.get(`/teams/${id}/members`),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
};

// Search endpoints
export const searchAPI = {
  global: (query, type, workspaceId) => 
    api.get('/search', { params: { q: query, type, workspace_id: workspaceId } }),
  suggestions: (query) => 
    api.get('/search/suggestions', { params: { q: query } }),
};

// Activity endpoints
export const activityAPI = {
  getAll: (filters) => api.get('/activities', { params: filters }),
  getFeed: () => api.get('/activities/feed'),
};

// Notification endpoints
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
