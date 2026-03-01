import axios from 'axios';
import { appStorage } from './appStorage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const BASE_URL = 'https://api.grovine.ng/api';

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    inMemoryAccessToken = token;
};

export const clearAccessToken = () => {
    inMemoryAccessToken = null;
};

const resolveAccessToken = async () => {
    if (inMemoryAccessToken) {
        return inMemoryAccessToken;
    }

    const storedToken = await appStorage.getItem(STORAGE_KEYS.accessToken);
    if (storedToken) {
        inMemoryAccessToken = storedToken;
    }
    return storedToken;
};

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await resolveAccessToken();
    if (token) {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
