import axios from "axios";

// In Next.js, we can just use /api as the base URL since the API is in the same app
// or use an environment variable if we want to point to an external API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
