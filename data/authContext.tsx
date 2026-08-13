import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { savePushToken } from "../api/client";
import { registerForPushNotificationsAsync } from "./pushNotifications";

const BASE_URL = "https://stylehub-backend-42fh.onrender.com";
const TOKEN_KEY = "stylehub_token";
const USER_KEY = "stylehub_user";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "customer" | "owner" | "professional";
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  register: (
    name: string,
    phone: string,
    password: string,
    role: "customer" | "owner" | "professional",
    inviteCode?: string,
    claimCode?: string,
    email?: string
  ) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reverify: (role: "owner" | "professional", inviteCode: string) => Promise<void>;
  updateProfile: (payload: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (!token) return;
    registerForPushNotificationsAsync()
      .then((pushToken) => {
        if (!pushToken) return;
        return savePushToken(pushToken, token);
      })
      .catch(() => {});
  }, [token]);

  async function persistAuth(newToken: string, newUser: AuthUser) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function register(
    name: string,
    phone: string,
    password: string,
    role: "customer" | "owner" | "professional",
    inviteCode?: string,
    claimCode?: string,
    email?: string
  ) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, role, inviteCode, claimCode, email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }
    await persistAuth(data.token, data.user);
  }

  async function login(phone: string, password: string) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }
    await persistAuth(data.token, data.user);
  }

  async function reverify(role: "owner" | "professional", inviteCode: string) {
    const response = await fetch(`${BASE_URL}/auth/reverify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role, inviteCode }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Invalid code");
    }
    await persistAuth(data.token, data.user);
  }

  async function updateProfile(payload: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update profile");
    await persistAuth(data.token, data.user);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, register, login, logout, reverify, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}