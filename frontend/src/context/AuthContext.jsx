import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokens } from "../api/client";
import { loginRequest, registerRequest, meRequest, logoutRequest } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!tokens.access) {
        setLoading(false);
        return;
      }
      try {
        const me = await meRequest();
        if (active) setUser(me);
      } catch {
        tokens.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (creds) => {
    await loginRequest(creds);
    const me = await meRequest();
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    await registerRequest(payload);
    return login({ email: payload.email, password: payload.password });
  }, [login]);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthed: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
