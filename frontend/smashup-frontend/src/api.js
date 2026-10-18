import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (username, password) =>
    axios.post(`${API_BASE}/auth/token/`, { username, password }),
  refresh: (refresh) =>
    axios.post(`${API_BASE}/auth/token/refresh/`, { refresh }),
  register: (userData) =>
    axios.post(`${API_BASE}/auth/register/`, userData),
  verify: (token) => axios.post(`${API_BASE}/auth/token/verify/`, { token }),
};

export const projectsAPI = {
  list: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
  transferOwnership: (id, newOwnerId) =>
    api.post(`/projects/${id}/transfer_ownership/`, { new_owner: newOwnerId }),
};

export const projectMembersAPI = {
  list: () => api.get('/project-members/'),
  create: (data) => api.post('/project-members/', data),
  remove: (id) => api.delete(`/project-members/${id}/`),
};

export const issuesAPI = {
  list: (params) => api.get('/issues/', { params }),
  create: (data) => api.post('/issues/', data),
  get: (id) => api.get(`/issues/${id}/`),
  update: (id, data) => api.patch(`/issues/${id}/`, data),
  assign: (id, data) => api.post(`/issues/${id}/assign/`, data),
  reassign: (id, data) => api.post(`/issues/${id}/reassign/`, data),
  unassign: (id) => api.post(`/issues/${id}/unassign/`),
  changeStatus: (id, data) => api.post(`/issues/${id}/status/`, data),
  changePriority: (id, data) => api.post(`/issues/${id}/priority/`, data),
  attachLabel: (id, data) => api.post(`/issues/${id}/attach_label/`, data),
  detachLabel: (id, data) => api.post(`/issues/${id}/detach_label/`, data),
};

export const issueCommentsAPI = {
  list: () => api.get('/issue-comments/'),
  create: (data) => api.post('/issue-comments/', data),
  update: (id, data) => api.patch(`/issue-comments/${id}/`, data),
  remove: (id) => api.delete(`/issue-comments/${id}/`),
};

export const issueLabelsAPI = {
  list: () => api.get('/issue-labels/'),
  create: (data) => api.post('/issue-labels/', data),
};
