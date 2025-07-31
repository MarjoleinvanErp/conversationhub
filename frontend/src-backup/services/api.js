import authService from './api/authService';

// Basis API URL - werkt met je huidige setup
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// PERFORMANCE: Simple cache voor GET requests
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconden

// PERFORMANCE: Helper functie voor cache management
const getCacheKey = (endpoint) => `api_${endpoint}`;
const isValidCache = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper functie voor headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // PERFORMANCE: Cache cleaning functie
  clearCache(pattern = null) {
    if (pattern) {
      // Clear specific cache entries
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      cache.clear();
    }
  }

  // GET request - NU MET CACHING
  async get(endpoint, useCache = true) {
    const cacheKey = getCacheKey(endpoint);
    
    // PERFORMANCE: Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (isValidCache(cached)) {
        console.log(`🚀 Cache hit for: ${endpoint}`);
        return cached.data;
      }
    }

    try {
      console.log(`📡 API call: GET ${endpoint}`);
      const startTime = performance.now();
      
      const response = await fetch(`${this.baseURL}/api${endpoint}`, {
        method: 'GET',
        mode: 'cors',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      
      console.log(`⚡ API response time: ${Math.round(endTime - startTime)}ms`);

      // PERFORMANCE: Cache successful GET requests
      if (useCache && response.ok) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }

  // POST request - NU MET PERFORMANCE MONITORING
  async post(endpoint, data = {}) {
    try {
      console.log(`📡 API call: POST ${endpoint}`);
      const startTime = performance.now();

      const response = await fetch(`${this.baseURL}/api${endpoint}`, {
        method: 'POST',
        mode: 'cors',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const endTime = performance.now();
      
      console.log(`⚡ API response time: ${Math.round(endTime - startTime)}ms`);

      // PERFORMANCE: Clear related cache entries
      if (result.status === 'success') {
        this.clearCache(endpoint.split('/')[1]); // Clear cache for related resources
      }

      return result;
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  }

  // PUT request - NU MET PERFORMANCE MONITORING
  async put(endpoint, data = {}) {
    try {
      console.log(`📡 API call: PUT ${endpoint}`);
      const startTime = performance.now();

      const response = await fetch(`${this.baseURL}/api${endpoint}`, {
        method: 'PUT',
        mode: 'cors',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const endTime = performance.now();
      
      console.log(`⚡ API response time: ${Math.round(endTime - startTime)}ms`);

      // PERFORMANCE: Clear related cache entries
      if (result.status === 'success') {
        this.clearCache(endpoint.split('/')[1]); // Clear cache for related resources
      }

      return result;
    } catch (error) {
      console.error('API PUT error:', error);
      throw error;
    }
  }

  // DELETE request - NU MET PERFORMANCE MONITORING
  async delete(endpoint) {
    try {
      console.log(`📡 API call: DELETE ${endpoint}`);
      const startTime = performance.now();

      const response = await fetch(`${this.baseURL}/api${endpoint}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const endTime = performance.now();
      
      console.log(`⚡ API response time: ${Math.round(endTime - startTime)}ms`);

      // PERFORMANCE: Clear related cache entries
      if (result.status === 'success') {
        this.clearCache(endpoint.split('/')[1]); // Clear cache for related resources
      }

      return result;
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  }

  // PERFORMANCE: Nieuwe helper methods voor betere performance
  
  // Get cache statistics (development helper)
  getCacheStats() {
    const stats = {
      size: cache.size,
      keys: Array.from(cache.keys()),
      validEntries: 0
    };

    for (const [key, value] of cache.entries()) {
      if (isValidCache(value)) {
        stats.validEntries++;
      }
    }

    return stats;
  }

  // Batch requests helper
  async batchGet(endpoints) {
    const promises = endpoints.map(endpoint => this.get(endpoint));
    return Promise.allSettled(promises);
  }

  // Health check helper
  async healthCheck() {
    try {
      const result = await this.get('/health', false); // Don't cache health checks
      return result;
    } catch (error) {
      return { status: 'error', message: 'Health check failed' };
    }
  }
}

// Export default instance
export default new ApiService();