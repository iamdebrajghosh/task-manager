import axios from "axios";
import { toast } from "react-toastify";

let accessTokenCache = null;
let refreshTokenCache = null;

export const setAccessToken = (token) => {
  accessTokenCache = token || null;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

export const setRefreshToken = (token) => {
  refreshTokenCache = token || null;
  if (token) localStorage.setItem("refreshToken", token);
  else localStorage.removeItem("refreshToken");
};

export const getAccessToken = () => accessTokenCache || localStorage.getItem("token");

export const clearAuth = () => {
  accessTokenCache = null;
  refreshTokenCache = null;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "/api",
});

const refreshClient = axios.create({
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
  const token = getAccessToken();
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

    if (config && typeof config.url === "string" && config.url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    const currentPath = window.location.pathname;
    if (currentPath === "/" || currentPath === "/register" || currentPath === "/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return Promise.reject(error);
    }

    const refreshToken = refreshTokenCache || localStorage.getItem("refreshToken");
    if (!refreshToken) {
      clearAuth();
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
      const res = await refreshClient.post("/auth/refresh", { refreshToken });
      const newAccessToken = res.data?.accessToken;
      const newRefreshToken = res.data?.refreshToken;
      if (newAccessToken) setAccessToken(newAccessToken);
      if (newRefreshToken) setRefreshToken(newRefreshToken);
      isRefreshing = false;
      onRefreshed(newAccessToken);
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      originalRequest.headers["x-auth-token"] = newAccessToken;
      toast.success("Token refreshed");
      return axiosInstance(originalRequest);
    } catch (e) {
      isRefreshing = false;
      clearAuth();
      const current = window.location.pathname;
      if (current !== "/login" && current !== "/register") {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  }
);

export default axiosInstance;
