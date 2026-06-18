import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const getHealth = () => api.get('/health');

export const getStatistics = () => api.get('/statistics');

export const getLocations = () => api.get('/locations');

export const predictTraffic = (payload) => api.post('/predict', payload);

export const getTrafficByHour = () => api.get('/traffic-by-hour');

export const getTrafficByDay = () => api.get('/traffic-by-day');

export const getCongestionByArea = () => api.get('/congestion-by-area');

export const getVisualizationData = () => api.get('/visualization-data');

export const getPredictionHistory = () => api.get('/prediction-history');

export default api;
