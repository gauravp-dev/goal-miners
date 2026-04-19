"use client";
import * as React from "react";

const STORAGE_KEY = "gm-client-id";

/**
 * Stable per-browser client id, persisted to localStorage.
 * We hand this to PartySocket as its `id` so reloads reconnect as the same
 * participant (no duplicate ghost players in the room).
 *
 * Returns `null` during SSR and the very first client render. Callers should
 * delay connecting until `id` is non-null.
 */
export function useClientId(): string | null {
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        setId(existing);
        return;
      }
      // randomUUID is supported in all modern browsers + secure contexts.
      const fresh =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `gm-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      localStorage.setItem(STORAGE_KEY, fresh);
      setId(fresh);
    } catch {
      // localStorage disabled / SSR — fall back to an ephemeral id.
      setId(`gm-${Math.random().toString(36).slice(2)}`);
    }
  }, []);

  return id;
}
