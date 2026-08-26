/**
 * Pure path check for 402 SUBSCRIPTION_REQUIRED soft-redirect.
 * Platform console must never bounce to tenant /settings/subscription.
 */
export function shouldRedirectOnSubscriptionRequired(pathname: string): boolean {
  if (pathname === "/platform" || pathname.startsWith("/platform/")) {
    return false;
  }
  if (
    pathname === "/settings/subscription" ||
    pathname.startsWith("/settings/subscription/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/profile" ||
    pathname === "/login"
  ) {
    return false;
  }
  return true;
}
