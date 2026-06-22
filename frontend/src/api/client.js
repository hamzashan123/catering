import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost/bookin-appliance-system-clean-react-mysqli/backend'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bookin_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (status === 401 && !requestUrl.includes('/auth/login')) {
      localStorage.removeItem('bookin_token');
    }

    return Promise.reject(error);
  }
);

export default api;
