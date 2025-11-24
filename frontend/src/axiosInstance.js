import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Handle invalid token responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage = error.response.data?.msg || error.response.data?.error || "";
      
      // Check if it's an invalid token error (401 or 400 with invalid token message)
      if (
        error.response.status === 401 ||
        (error.response.status === 400 && 
         (errorMessage.includes("Invalid token") || 
          errorMessage.includes("No token") ||
          errorMessage.includes("access denied")))
      ) {
        // Don't redirect if we're on login or register page
        const currentPath = window.location.pathname;
        if (currentPath === "/" || currentPath === "/register" || currentPath === "/login") {
          // Just clear token but don't redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return Promise.reject(error);
        }
        
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Redirect to login if not already there
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
