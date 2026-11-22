/**
 * 저장 계층 추상화. MVP 는 localStorage, 이후 Supabase 어댑터로 교체 가능하도록
 * Zustand persist 가 요구하는 StateStorage 와 동일한 형태를 유지한다.
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export const STORAGE_KEYS = {
  home: "nook:home",
  labels: "nook:labels",
  settings: "nook:settings",
  seeded: "nook:seeded",
} as const;
