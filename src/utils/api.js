import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ns-acad-backend.onrender.com/',
  // baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  },
  // CRUCIAL: This enables sending cookies/sessions with requests
  withCredentials: true,
  // Optional: Set timeout
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add token if you're using both token and session authentication
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the request for debugging (remove in production)
    console.log('Making request to:', config.baseURL + config.url);
    console.log('With credentials:', config.withCredentials);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses (remove in production)
    console.log('Response received:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle specific CORS errors
    if (error.message.includes('CORS')) {
      console.error('CORS Error: Make sure backend allows your domain');
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR') {
      console.error('Network Error: Check if backend is running');
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('Authentication Error: User not logged in');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Example usage in your components:
/*
// Login function example
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Other API calls
export const fetchUserData = async () => {
  try {
    const response = await api.get('/auth/user');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};
*/
