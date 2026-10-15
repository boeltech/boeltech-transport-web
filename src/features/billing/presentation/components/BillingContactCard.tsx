import { BillingContactLink } from "./BillingContactLink";

/**
 * @deprecated Prefer `BillingContactLink` (D5 — sin Card).
 * Reexporta el link para no romper imports legacy.
 */
export function BillingContactCard() {
  return <BillingContactLink />;
}
