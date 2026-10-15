import { billingCopy } from "../copy/billingCopy";

/**
 * Contacto SaaS como link mailto (D5) — sin Card.
 */
export function BillingContactLink() {
  const copy = billingCopy.contact;

  return (
    <p className="text-sm text-muted-foreground">
      {copy.prompt}{" "}
      <a
        className="font-medium text-foreground underline underline-offset-4"
        href={`mailto:${copy.email}`}
      >
        {copy.cta}
      </a>
    </p>
  );
}
