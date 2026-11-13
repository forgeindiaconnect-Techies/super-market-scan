import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Automatically attach token & tenant supermarket ID to every request
API.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("grocerease_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active supermarket context
    const currentSupermarketJson = localStorage.getItem("grocerease_current_supermarket");
    if (currentSupermarketJson) {
      const store = JSON.parse(currentSupermarketJson);
      if (store?._id) {
        config.headers["x-supermarket-id"] = store._id;
      }
      if (store?.code) {
        config.headers["x-supermarket-code"] = store.code;
      }
    }
  } catch (_) {}

  return config;
});

export default API;
