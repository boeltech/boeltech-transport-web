/**
 * One-shot hydration for /settings/billing.
 * Upload CSD updates React Query cache (certificate flags) without resetting
 * dirty serie/folio/defaults fields — once hydrated for a settings id, the
 * effect does not call reset again until the id changes or save succeeds.
 */

export function billingSettingsHydrationKey(settingsId: string): string {
  return settingsId.trim();
}

export function shouldHydrateBillingSettings(
  hydratedKey: string | null,
  settingsId: string | null | undefined,
): boolean {
  if (!settingsId?.trim()) return false;
  return hydratedKey !== billingSettingsHydrationKey(settingsId);
}
