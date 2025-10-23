import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL + "/api";

const instance = axios.create({
  baseURL: API_BASE,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // ✅ use same key everywhere
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
