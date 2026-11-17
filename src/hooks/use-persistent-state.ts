import { useEffect, useRef, useState } from "react";

/**
 * useState that is loaded from localStorage after hydration and saved on change.
 * Server and first client render both use `initial`, so there is no hydration mismatch.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore corrupt storage */
    }
    loaded.current = true;
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable */
    }
  }, [key, value]);

  return [value, setValue, hydrated] as const;
}
