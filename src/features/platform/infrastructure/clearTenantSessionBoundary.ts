/**
 * Clears tenant session material before establishing a Platform session.
 * Best-effort cookie logout when AUTH_SESSION_MODE uses cookies; always clears
 * tenant localStorage tokens/user.
 */

import { tokenStorage } from "@features/auth/infrastructure/storage/tokenStorage";
import { usesAuthCookies } from "@features/auth/infrastructure/sessionMode";
import { apiClient } from "@shared/api";

export async function clearTenantSessionForPlatformBoundary(): Promise<void> {
  if (usesAuthCookies()) {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Best-effort clear of tenant cookies before platform session.
    }
  }
  tokenStorage.clear();
}
