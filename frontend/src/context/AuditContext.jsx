import { createContext, useContext, useState, useCallback } from "react";
import { getAudit } from "../api/audits";

// Holds the most recent real audit (token, screenshots, accessibility) and the
// currently selected issue id — shared so Recommendations, Generated Code and
// Before vs After stay synchronized. Persisted to sessionStorage.
const KEY = "uxsense.currentAudit";
const SEL_KEY = "uxsense.selectedIssue";
const AuditContext = createContext(null);

function load(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuditProvider({ children }) {
  const [current, setState] = useState(() => load(KEY));
  const [selectedIssueId, setSel] = useState(() => load(SEL_KEY));

  const setCurrent = useCallback((audit) => {
    setState(audit);
    try {
      if (audit) sessionStorage.setItem(KEY, JSON.stringify(audit));
      else sessionStorage.removeItem(KEY);
    } catch { /* ignore */ }
    // New audit clears the previously selected issue.
    setSel(null);
    try { sessionStorage.removeItem(SEL_KEY); } catch { /* ignore */ }
  }, []);

  const setSelectedIssueId = useCallback((id) => {
    setSel(id);
    try {
      if (id) sessionStorage.setItem(SEL_KEY, JSON.stringify(id));
      else sessionStorage.removeItem(SEL_KEY);
    } catch { /* ignore */ }
  }, []);

  // Load a past audit (by token) back into every page.
  const loadAuditByToken = useCallback(async (token) => {
    const a = await getAudit(token);
    setCurrent({
      token: a.token,
      url: a.url,
      final_url: a.final_url,
      domain: a.domain,
      title: a.title,
      screenshots: a.screenshots || [],
      accessibility: a.accessibility || null,
    });
    return a;
  }, [setCurrent]);

  return (
    <AuditContext.Provider value={{ current, setCurrent, selectedIssueId, setSelectedIssueId, loadAuditByToken }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useCurrentAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useCurrentAudit must be used within <AuditProvider>");
  return ctx;
}
