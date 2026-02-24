import axios from 'axios';

export const BASE_URL = 'https://api.grovine.ng';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors here if needed
        return Promise.reject(error);
    }
);

export default api;
