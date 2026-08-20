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
  backgroundGradient: ["#FDF9F4", "#F0DFC4"] as [string, string],
  card: "#ffffff",
  cardAlt: "#E8D9C4",
  text: "#2B2622",
  muted: "#8C8378",
  clay: "#C1683C",
  rust: "#A8442B",
  border: "#EFE6D9",
  inputBg: "#ffffff",
  sectionBg: "#ffffff",
};

export const darkColors: typeof lightColors = {
  background: "#121212",
  backgroundGradient: ["#161616", "#2B2115"] as [string, string],
  card: "#1E1E1E",
  cardAlt: "#332C22",
  text: "#F0EAE2",
  muted: "#9B9691",
  clay: "#C1683C",
  rust: "#E05A3A",
  border: "#333333",
  inputBg: "#1E1E1E",
  sectionBg: "#1E1E1E",
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
