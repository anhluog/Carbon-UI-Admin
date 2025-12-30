// src/utils/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
});

// Request interceptor: Add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Added Bearer token to request:", config.url);
    } else {
      console.warn("⚠️ No token found for request:", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Chỉ redirect cho auth errors (401/403), log cho DB errors (400/500)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    console.error(`❌ API Error [${status}]: ${error.message} for ${error.config?.url}`);
    if (error.response?.data) {
      console.error("Backend details:", error.response.data);
    }

    // Chỉ logout/redirect cho auth errors
    if (status === 401 || status === 403) {
      console.warn("⚠️ Auth error (401/403) - Logging out and redirecting to login");
      localStorage.removeItem('token');
      window.location.href = '/login';  // Hoặc useNavigate() nếu React Router
    } else if (status >= 400 && status < 500) {  // Client errors (400, 422) - Alert user
      alert(`Lỗi từ server: ${error.response?.data?.message || 'Dữ liệu không hợp lệ'}`);
    } else if (status >= 500) {  // Server errors (500) - Alert DB/server issue
      alert(`Lỗi server (DB): ${error.response?.data?.message || 'Lưu dự án thất bại, thử lại'}`);
    }

    return Promise.reject(error);  // Throw error để frontend catch (handleSubmit)
  }
);

export default api;