import axios from "axios";

// Standard Practice: Use NEXT_PUBLIC prefix for client-side env variables.
// Fallback URL is provided to prevent runtime crashes if env is missing.
export const API_LINK = process.env.NEXT_PUBLIC_API_URL || "https://ieee-zsb-website.runasp.net/api";

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
      } catch (error) {
        // Log malformed data for debugging while keeping the app running
        console.error("Auth Token Parsing Error:", error);
      }
    }
  }
  return config;
});

// Added Response Interceptor for global error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Global Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;