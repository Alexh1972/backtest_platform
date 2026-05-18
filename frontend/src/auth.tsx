import { createContext, useCallback, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "backtest.token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  const setToken = useCallback((t: string | null) => {
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
    setTokenState(t);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokenState(null);
  }, []);

  const value = useMemo(() => ({ token, setToken, logout }), [token, setToken, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
