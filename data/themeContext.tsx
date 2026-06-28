import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const THEME_KEY = "stylehub_theme";

type ThemeContextType = {
  theme: ThemeMode;
  colors: typeof lightColors;
  toggleTheme: () => void;
};

export const lightColors = {
  background: "#FBF7F2",
  card: "#ffffff",
  text: "#2B2622",
  muted: "#8C8378",
  clay: "#C1683C",
  rust: "#A8442B",
  border: "#EFE6D9",
  inputBg: "#ffffff",
  sectionBg: "#ffffff",
};

export const darkColors = {
  background: "#1A1512",
  card: "#2A2118",
  text: "#F0EAE2",
  muted: "#9B8F85",
  clay: "#C1683C",
  rust: "#E05A3A",
  border: "#3A2E25",
  inputBg: "#2A2118",
  sectionBg: "#2A2118",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === "dark" || stored === "light") setTheme(stored);
    });
  }, []);

  async function toggleTheme() {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(next);
    await SecureStore.setItemAsync(THEME_KEY, next);
  }

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
