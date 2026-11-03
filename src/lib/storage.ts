/* localStorage 在無痕模式或被封鎖時會丟例外，全部包起來 */
export function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStore(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* 寫不進去就算了 */
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readStore(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
