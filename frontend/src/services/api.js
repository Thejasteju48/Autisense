import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Children APIs
export const childrenAPI = {
  getAll: () => api.get('/children'),
  getOne: (id) => api.get(`/children/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/children', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/children/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/children/${id}`),
};

// Screening APIs
export const screeningAPI = {
  start: (childId, type = 'Live Video') => api.post('/screenings/start', { childId, type }),
  
  submitQuestionnaire: (screeningId, data) => 
    api.post(`/screenings/${screeningId}/questionnaire`, data),
  complete: (screeningId) => api.post(`/screenings/${screeningId}/complete`),
  getOne: (screeningId) => api.get(`/screenings/${screeningId}`),
  getByChild: (childId) => api.get(`/screenings/child/${childId}`),
  getLatest: (childId) => api.get(`/screenings/child/${childId}/latest`),
  downloadReport: (screeningId) => 
    api.get(`/screenings/${screeningId}/report`, { responseType: 'blob' }),
};

export default api;
