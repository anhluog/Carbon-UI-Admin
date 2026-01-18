import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  timeout: 10000,
});

/**
 * ===============================
 * REQUEST INTERCEPTOR
 * ===============================
 * Gắn Bearer token nếu có
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Bearer token attached:', config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ===============================
 * RESPONSE INTERCEPTOR
 * ===============================
 * Xử lý lỗi tập trung
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ API Error [${status}] at ${url}`);

    /**
     * 🔴 401 – Unauthorized
     * Token hết hạn / không hợp lệ
     * → logout
     */
    if (status === 401) {
      console.warn('🔒 Unauthorized (401) → logout');

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // tránh redirect loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    /**
     * 🟠 403 – Forbidden
     * Có token nhưng không đủ quyền
     * → KHÔNG logout
     */
    if (status === 403) {
      console.warn('⛔ Forbidden (403)');
      // FE có thể handle riêng nếu muốn
      return Promise.reject(error);
    }

    /**
     * 🟡 4xx – Client errors
     */
    if (status && status >= 400 && status < 500) {
      console.warn('⚠️ Client error:', error.response?.data);
    }

    /**
     * 🔥 5xx – Server errors
     */
    if (status && status >= 500) {
      alert(
        error.response?.data?.message ||
        'Lỗi hệ thống, vui lòng thử lại sau'
      );
    }

    return Promise.reject(error);
  }
);

export default api;
