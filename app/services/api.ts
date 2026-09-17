import axios, { AxiosError } from 'axios';
import { localDb } from '@/app/services/localDb';

/**
 * Base URL of the GabAi backend.
 *
 * Set EXPO_PUBLIC_API_URL in the frontend `.env`, e.g.
 *   EXPO_PUBLIC_API_URL="http://192.168.1.15:8000"
 *
 * On a physical phone "localhost" points to the PHONE, not your laptop —
 * use the laptop's LAN IP (the same one shown in the Expo QR code) and the
 * backend's port (8000). Restart Expo with `npx expo start -c` after editing.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach the JWT from the last successful login to every request.
api.interceptors.request.use((config) => {
  const token = localDb.getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turn axios' bare "Network Error" into something actionable during development.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      const target = API_BASE_URL || '(EXPO_PUBLIC_API_URL is not set)';
      const reason = error.code === 'ECONNABORTED' ? 'The request timed out.' : 'The server could not be reached.';
      error.message = `${reason}\n\nAPI URL: ${target}\n\nCheck that the backend is running, the phone and laptop are on the same Wi-Fi, and the URL uses your laptop's LAN IP (not localhost).`;
    }
    return Promise.reject(error);
  }
);

export default api;
