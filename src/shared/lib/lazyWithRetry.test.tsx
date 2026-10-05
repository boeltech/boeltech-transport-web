import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHUNK_RELOAD_KEY,
  CHUNK_RELOAD_TTL_MS,
  canClaimChunkReload,
  claimChunkReload,
  importWithRetry,
  isChunkLoadError,
  tryReloadOnceForChunkLoad,
} from "./lazyWithRetry";

const CHUNK_ERROR = new TypeError(
  "Failed to fetch dynamically imported module: http://localhost:5173/src/features/drivers/index.ts",
);

describe("isChunkLoadError", () => {
  it("matches known chunk-load / dynamic-import messages", () => {
    expect(isChunkLoadError(CHUNK_ERROR)).toBe(true);
    expect(
      isChunkLoadError(new TypeError("Importing a module script failed.")),
    ).toBe(true);
    expect(
      isChunkLoadError(
        new Error("error loading dynamically imported module: /assets/foo.js"),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error("Loading chunk 12 failed. (error: 404)")),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error("Loading CSS chunk 3 failed.")),
    ).toBe(true);
  });

  it("returns false for generic errors", () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of null"))).toBe(
      false,
    );
    expect(isChunkLoadError(new Error("Network Error"))).toBe(false);
    expect(isChunkLoadError("boom")).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("chunk reload guard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("allows the first claim and blocks a second within the TTL", () => {
    const now = 1_000_000;
    expect(canClaimChunkReload(now)).toBe(true);
    expect(claimChunkReload(now)).toBe(true);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe(String(now));
    expect(canClaimChunkReload(now + 500)).toBe(false);
    expect(claimChunkReload(now + 500)).toBe(false);
  });

  it("allows another claim after the TTL expires", () => {
    const now = 1_000_000;
    expect(claimChunkReload(now)).toBe(true);
    expect(canClaimChunkReload(now + CHUNK_RELOAD_TTL_MS)).toBe(true);
  });

  it("tryReloadOnceForChunkLoad reloads once then no-ops", () => {
    const reload = vi.fn();
    const now = 2_000_000;
    expect(tryReloadOnceForChunkLoad(now, sessionStorage, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(tryReloadOnceForChunkLoad(now + 100, sessionStorage, reload)).toBe(
      false,
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("importWithRetry", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("retries a chunk-load failure once and resolves", async () => {
    const importFn = vi
      .fn<() => Promise<{ default: string }>>()
      .mockRejectedValueOnce(CHUNK_ERROR)
      .mockResolvedValueOnce({ default: "ok" });

    const result = await importWithRetry(importFn, { retryDelayMs: 0 });

    expect(result).toEqual({ default: "ok" });
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-chunk errors", async () => {
    const boom = new TypeError("Cannot read properties of undefined");
    const importFn = vi.fn().mockRejectedValue(boom);

    await expect(importWithRetry(importFn, { retryDelayMs: 0 })).rejects.toBe(
      boom,
    );
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it("reloads once when retry also fails, then does not reload again", async () => {
    const reload = vi.fn();
    const importFn = vi.fn().mockRejectedValue(CHUNK_ERROR);

    await expect(
      importWithRetry(importFn, {
        retryDelayMs: 0,
        now: 3_000_000,
        storage: sessionStorage,
        reload,
      }),
    ).rejects.toBe(CHUNK_ERROR);
    expect(importFn).toHaveBeenCalledTimes(2);
    expect(reload).toHaveBeenCalledTimes(1);

    await expect(
      importWithRetry(importFn, {
        retryDelayMs: 0,
        now: 3_000_100,
        storage: sessionStorage,
        reload,
      }),
    ).rejects.toBe(CHUNK_ERROR);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
