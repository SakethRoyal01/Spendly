/**
 * Safe local storage wrapper with robust error handling and fallback
 */
export const safeStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[safeStorage] Failed to read key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[safeStorage] Failed to write key "${key}":`, error);
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[safeStorage] Failed to remove key "${key}":`, error);
      return false;
    }
  },

  clear(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('[safeStorage] Failed to clear storage:', error);
      return false;
    }
  }
};

