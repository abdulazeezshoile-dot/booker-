import { Platform } from 'react-native';

// Multi-environment configuration
const ENV = process.env.APP_ENV || 'development';

const URLS = {
  development: process.env.EXPO_PUBLIC_API_URL, // from EAS env
  staging: process.env.EXPO_PUBLIC_API_URL_STAGING, // optional, add if needed
  production: process.env.EXPO_PUBLIC_API_URL_PRODUCTION || 'https://your-production-api.com',
};

const getBaseUrl = () => {
  const url = URLS[ENV];

  if (!url) {
    console.warn(`[API] ${ENV} API URL is not set! Falling back to local defaults.`);
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  }

  return url.replace(/\/$/, '');
};

let authToken = null;
export const setAuthToken = (token) => {
  authToken = token;
};

const buildUrl = (path, query) => {
  const base = getBaseUrl().replace(/\/$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${trimmedPath}`;

  if (query && typeof query === 'object') {
    const params = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    if (params) {
      url += `?${params}`;
    }
  }

  return url;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (data && data.message) || response.statusText || 'Request failed';
    const error = new Error(message);
    error.response = response;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: async (path, query) => {
    const url = buildUrl(path, query);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });
    return handleResponse(response);
  },

  post: async (path, body) => {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (path, body) => {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (path) => {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });
    return handleResponse(response);
  },
};