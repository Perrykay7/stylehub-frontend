import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const BASE_URL = "https://stylehub-backend-42fh.onrender.com";
const TOKEN_KEY = "stylehub_token";
const USER_KEY = "stylehub_user";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: "customer" | "owner";
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  register: (
    name: string,
    phone: string,
    password: string,
    role: "customer" | "owner",
    inviteCode?: string
  ) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reverifyOwner: (inviteCode: string) => Promise<void>;
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
    role: "customer" | "owner",
    inviteCode?: string
  ) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, role, inviteCode }),
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

  async function reverifyOwner(inviteCode: string) {
    const response = await fetch(`${BASE_URL}/auth/reverify-owner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Invalid invite code");
    }
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
      value={{ user, token, loading, register, login, logout, reverifyOwner }}
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