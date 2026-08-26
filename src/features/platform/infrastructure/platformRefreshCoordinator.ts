/**
 * Single-flight refresh for platform Bearer tokens.
 * Shared by PlatformAuthProvider bootstrap and authInterceptor.
 */

export type PlatformRefreshTokens = {
  accessToken: string;
  refreshToken: string;
};

let inFlight: Promise<PlatformRefreshTokens> | null = null;

export function runPlatformRefresh(
  factory: () => Promise<PlatformRefreshTokens>,
): Promise<PlatformRefreshTokens> {
  if (!inFlight) {
    inFlight = factory().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function resetPlatformRefreshCoordinator(): void {
  inFlight = null;
}

/** Test helper — whether a refresh is currently in flight. */
export function isPlatformRefreshInFlight(): boolean {
  return inFlight != null;
}
