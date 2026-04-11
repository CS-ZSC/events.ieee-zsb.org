import axios from "axios";

export const API_LINK = process.env.API_URL!;

const api = axios.create({
  baseURL: API_LINK,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("user-data");
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // ignore malformed data
      }
    }
  }
  return config;
});

export default api;