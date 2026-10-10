import axios from 'axios';

// Get API base URL from Vite environment variables, fallback to local development URL
export const API_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000/api/v1`;

// Setup global Axios interceptors for handling connection errors
export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if it's a network error (backend unreachable)
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.error('Network Error: Unable to connect to the API.');
        
        // Prevent showing the alert multiple times in quick succession
        if (!window.sessionStorage.getItem('network_error_shown')) {
          window.sessionStorage.setItem('network_error_shown', 'true');
          alert('Production data service unavailable.\nPlease check the connection and try again.');
          setTimeout(() => {
            window.sessionStorage.removeItem('network_error_shown');
          }, 5000);
        }
      } else if (error.response && error.response.status >= 500) {
          if (!window.sessionStorage.getItem('db_error_shown')) {
            window.sessionStorage.setItem('db_error_shown', 'true');
            alert('Production data service unavailable.');
            setTimeout(() => {
              window.sessionStorage.removeItem('db_error_shown');
            }, 5000);
          }
      }
      return Promise.reject(error);
    }
  );
};
