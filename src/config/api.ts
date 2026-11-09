import axios from 'axios';

/**
 * API base URL.
 * - In production (Vercel): uses VITE_API_BASE_URL env var, which should be set to "/api/v1"
 *   (relative URL that Vercel rewrites to the FastAPI serverless function).
 * - Local development fallback: connects to localhost:8000/api/v1 (Uvicorn dev server).
 *
 * IMPORTANT: Never set VITE_API_BASE_URL to a localhost URL in the Vercel environment.
 */
function resolveApiUrl(): string {
  // 1. Explicit env var takes priority (set to "/api/v1" in Vercel project settings)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

  // 2. In production builds (non-localhost), use relative path so Vercel rewrites work
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return '/api/v1';
  }

  // 3. Local development
  return `http://localhost:8000/api/v1`;
}

export const API_URL = resolveApiUrl();

/** Set up global Axios interceptors for structured error handling */
export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.error('[IR-IWQMS] Network error — API unreachable:', error.message);
      } else if (error.response?.status >= 500) {
        console.error('[IR-IWQMS] Server error:', error.response.status, error.response.data);
      }
      return Promise.reject(error);
    }
  );
};
