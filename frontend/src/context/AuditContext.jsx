import { createContext, useContext, useState, useCallback } from "react";

// Holds the most recent real audit (screenshots) so the dashboard can show it.
// Persisted to sessionStorage so a refresh keeps the last capture.
const KEY = "uxsense.currentAudit";
const AuditContext = createContext(null);

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuditProvider({ children }) {
  const [current, setState] = useState(load);

  const setCurrent = useCallback((audit) => {
    setState(audit);
    try {
      if (audit) sessionStorage.setItem(KEY, JSON.stringify(audit));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  return (
    <AuditContext.Provider value={{ current, setCurrent }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useCurrentAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useCurrentAudit must be used within <AuditProvider>");
  return ctx;
}
