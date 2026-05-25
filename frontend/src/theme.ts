import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "backtest.theme";

export function getStoredTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

// React hook: keeps the <html data-theme> attribute and localStorage in sync.
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(t: Theme) {
    storeTheme(t);
    setThemeState(t);
  }

  return [theme, setTheme];
}
