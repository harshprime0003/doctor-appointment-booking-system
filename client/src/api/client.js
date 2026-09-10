import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('mb_token', token);
  else localStorage.removeItem('mb_token');
}

export function loadAuthToken() {
  authToken = localStorage.getItem('mb_token');
  return authToken;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    // A 401 on a token-bearing request means the session is invalid or expired
    // (e.g. the account was removed / the database was re-seeded). Clear it and
    // send the user to the login screen instead of silently failing.
    if (status === 401 && !isAuthRoute && authToken) {
      setAuthToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=1');
      }
    }

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    const details = error.response?.data?.error?.details;
    return Promise.reject({ message, details, status });
  },
);

export default api;
