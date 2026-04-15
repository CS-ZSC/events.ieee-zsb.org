import axios from "axios";

// Standard Practice: Use NEXT_PUBLIC prefix for client-side env variables.
// Fallback URL is provided to prevent runtime crashes if env is missing.
export const API_LINK = process.env.NEXT_PUBLIC_API_URL || "https://ieee-zsb-website.runasp.net/api";

const api = axios.create({
  baseURL: API_LINK,
});


api.interceptors.request.use(
  (config) => {
    const rawData = localStorage.getItem("user-data");
    
    if (rawData) {
      try {
        const userData = JSON.parse(rawData);
        if (userData && userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage", error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Added Response Interceptor for global error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Global Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;