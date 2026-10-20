import axios from "axios";
import { API_URL } from "./config";

/**
 * Centralized Axios instance with auth interceptor.
 * Automatically attaches Bearer token from localStorage
 * and redirects to /login on 401 responses.
 */
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("email_verified");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
