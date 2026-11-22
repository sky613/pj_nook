import type { StorageAdapter } from "./adapter";

const memory = new Map<string, string>();

/** SSR / 프라이빗 모드 등 localStorage 불가 환경에서는 메모리로 폴백 */
export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    try {
      if (typeof window === "undefined") return memory.get(key) ?? null;
      return window.localStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key, value) {
    try {
      if (typeof window === "undefined") {
        memory.set(key, value);
        return;
      }
      window.localStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  removeItem(key) {
    try {
      if (typeof window === "undefined") {
        memory.delete(key);
        return;
      }
      window.localStorage.removeItem(key);
    } catch {
      memory.delete(key);
    }
  },
};

export const getStorageAdapter = (): StorageAdapter => localStorageAdapter;
