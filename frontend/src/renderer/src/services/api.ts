import axios from "axios";
import { useAuthStore } from "@/hooks/useAuthStore";

export const api = axios.create({
  baseURL: "http://localhost:9000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
