import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import axios, { getAccessToken, setAccessToken, setRefreshToken, clearAuth } from "../axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccess] = useState(getAccessToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email: email.trim(), password });
      const at = res.data?.accessToken;
      const rt = res.data?.refreshToken;
      if (at) {
        setAccessToken(at);
        setAccess(at);
        setIsAuthenticated(true);
      }
      if (rt) setRefreshToken(rt);
      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
      return { ok: true, user: res.data?.user };
    } catch (err) {
      return { ok: false, error: err.response?.data?.msg || err.response?.data?.error || err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAccess(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return { ok: false };
    try {
      const res = await axios.post("/auth/refresh", { refreshToken });
      const at = res.data?.accessToken;
      const rt = res.data?.refreshToken;
      if (at) {
        setAccessToken(at);
        setAccess(at);
        setIsAuthenticated(true);
      }
      if (rt) setRefreshToken(rt);
      return { ok: true };
    } catch (_) {
      logout();
      return { ok: false };
    }
  }, [logout]);

  const fetchMe = useCallback(async () => {
    try {
      const res = await axios.get("/user/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!getAccessToken() && localStorage.getItem("refreshToken")) {
        const r = await refresh();
        if (r.ok) await fetchMe();
      } else {
        const raw = localStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const value = useMemo(
    () => ({ user, accessToken, isAuthenticated, loading, login, logout, refresh, fetchMe }),
    [user, accessToken, isAuthenticated, loading, login, logout, refresh, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);