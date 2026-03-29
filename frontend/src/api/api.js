import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5001/api', // Adjusted to common flask host
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401 Unauthorized, log out the user
    // Make sure we DONT trigger this for the login endpoint itself, so we can show login errors
    if (error.response && error.response.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;
