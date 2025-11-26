import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "/api",
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response) return Promise.reject(error);
    const msg = response.data?.msg || response.data?.error || "";
    const isAuthError = response.status === 401 || (response.status === 400 && (msg.includes("Invalid token") || msg.includes("No token") || msg.includes("access denied")));
    if (!isAuthError) return Promise.reject(error);

    const currentPath = window.location.pathname;
    if (currentPath === "/" || currentPath === "/register" || currentPath === "/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    const originalRequest = config;
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers["x-auth-token"] = newToken;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const res = await axios.post("http://localhost:5000/api/auth/refresh-token", { refreshToken });
      const newAccessToken = res.data?.accessToken;
      const newRefreshToken = res.data?.refreshToken;
      if (newAccessToken) localStorage.setItem("token", newAccessToken);
      if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
      isRefreshing = false;
      onRefreshed(newAccessToken);
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      originalRequest.headers["x-auth-token"] = newAccessToken;
      return axiosInstance(originalRequest);
    } catch (e) {
      isRefreshing = false;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }
  }
);

export default axiosInstance;
