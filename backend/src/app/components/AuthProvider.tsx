"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "INFLUENCER" | "SELLER" | "ADMIN";
  handle: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface AuthCtx {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  token: null, user: null, loading: true,
  login: async () => {}, logout: () => {}, refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe(tok: string) {
    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${tok}` } });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      localStorage.removeItem("libos_token");
      setToken(null);
      setUser(null);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("libos_token");
    if (saved) {
      setToken(saved);
      fetchMe(saved).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(tok: string) {
    localStorage.setItem("libos_token", tok);
    setToken(tok);
    await fetchMe(tok);
  }

  function logout() {
    localStorage.removeItem("libos_token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }

  async function refreshUser() {
    if (token) await fetchMe(token);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
