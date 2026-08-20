import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export const CHUNK_RELOAD_KEY = "chunk-reload-ts";
export const CHUNK_RELOAD_TTL_MS = 10_000;
export const CHUNK_RETRY_DELAY_MS = 1_000;

const CHUNK_LOAD_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\d]+ failed|Loading CSS chunk/i;

export type ImportWithRetryOptions = {
  maxRetries?: number;
  retryDelayMs?: number;
  now?: number;
  storage?: Storage;
  reload?: () => void;
};

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error ?? "");
  return CHUNK_LOAD_ERROR_RE.test(message);
}

function getStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function defaultReload(): void {
  window.location.reload();
}

function readReloadTimestamp(storage: Storage): number | null {
  try {
    const raw = storage.getItem(CHUNK_RELOAD_KEY);
    if (raw == null || raw === "") return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export function canClaimChunkReload(
  now: number = Date.now(),
  storage?: Storage,
): boolean {
  const store = getStorage(storage);
  if (!store) return false;
  const ts = readReloadTimestamp(store);
  if (ts == null) return true;
  return now - ts >= CHUNK_RELOAD_TTL_MS;
}

export function markChunkReload(
  now: number = Date.now(),
  storage?: Storage,
): void {
  const store = getStorage(storage);
  if (!store) return;
  try {
    store.setItem(CHUNK_RELOAD_KEY, String(now));
  } catch {
    // Private mode / quota: skip persist; caller still decides whether to reload.
  }
}

export function claimChunkReload(
  now: number = Date.now(),
  storage?: Storage,
): boolean {
  if (!canClaimChunkReload(now, storage)) return false;
  markChunkReload(now, storage);
  return true;
}

export function tryReloadOnceForChunkLoad(
  now: number = Date.now(),
  storage?: Storage,
  reload: () => void = defaultReload,
): boolean {
  if (!claimChunkReload(now, storage)) return false;
  reload();
  return true;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function importWithRetry<T>(
  importFn: () => Promise<T>,
  options: ImportWithRetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 1;
  const retryDelayMs = options.retryDelayMs ?? CHUNK_RETRY_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;
      const canRetry = isChunkLoadError(error) && attempt < maxRetries;
      if (!canRetry) break;
      if (retryDelayMs > 0) {
        await wait(retryDelayMs);
      }
    }
  }

  if (isChunkLoadError(lastError)) {
    tryReloadOnceForChunkLoad(options.now, options.storage, options.reload);
  }

  throw lastError;
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: ImportWithRetryOptions,
): LazyExoticComponent<T> {
  return lazy(() => importWithRetry(importFn, options));
}
