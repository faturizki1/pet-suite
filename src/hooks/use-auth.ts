"use client";

import { useState, useEffect, useCallback } from "react";

export type UserRole = "owner" | "dokter" | "staff" | "customer";

export interface UserSession {
  sub: string;
  role: UserRole;
  namaLengkap: string;
  email: string;
  is_active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setUser(json?.data ?? null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Login gagal");
    setUser(json.data);
    return json.data;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout");
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      return user !== null && roles.includes(user.role);
    },
    [user]
  );

  return { user, loading, login, logout, hasRole };
}