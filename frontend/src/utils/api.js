const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add token if available
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);
        
        // Try to parse JSON, but handle cases where response might not be JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
        }
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        // If it's already an Error object with a message, throw it as is
        if (error instanceof Error) {
            throw error;
        }
        // Otherwise, wrap it in an Error
        throw new Error(error.message || 'Network error. Please check your connection.');
    }
};

// Auth API
export const authAPI = {
    signup: async (userData) => {
        return apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    login: async (email, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }
};

// Food API
export const foodAPI = {
    list: async () => {
        return apiRequest('/food/list', {
            method: 'GET'
        });
    }
};

// Review API
export const reviewAPI = {
    listForFood: async (foodId) => {
        return apiRequest(`/reviews/food/${foodId}`, {
            method: 'GET'
        });
    },
    listMine: async () => {
        return apiRequest('/reviews/me', {
            method: 'GET'
        });
    },
    listAll: async () => {
        return apiRequest('/reviews', {
            method: 'GET'
        });
    },
    create: async (foodId, payload) => {
        return apiRequest(`/reviews/food/${foodId}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    update: async (reviewId, payload) => {
        return apiRequest(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },
    remove: async (reviewId) => {
        return apiRequest(`/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    }
};

// Recommendation API
export const recommendationAPI = {
    getMyRecommendations: async (topN = 10) => {
        return apiRequest(`/recommendations/me?topN=${topN}`, {
            method: 'GET'
        });
    },
    getUserRecommendations: async (userId, topN = 10) => {
        return apiRequest(`/recommendations/${userId}?topN=${topN}`, {
            method: 'GET'
        });
    }
};

export default apiRequest;

