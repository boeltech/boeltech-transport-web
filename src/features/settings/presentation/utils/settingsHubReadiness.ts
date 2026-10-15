/**
 * Chips de readiness del hub Configuración.
 * Solo datos ya existentes (identidad + sello/numeración); sin inventar contrato.
 */

import type { HubReadinessItem } from "@shared/ui/page-shells";
import type { BillingSettings, CompanySettings } from "../../domain";
import { settingsHubCopy } from "../copy/settingsHubCopy";
import { isCompanyIdentityReady } from "./companyIdentityReadiness";
import {
  resolveCertificateReadiness,
  resolveNumberingReadiness,
} from "./billingReadiness";

const copy = settingsHubCopy.readiness;

export function buildSettingsHubReadiness(input: {
  company: CompanySettings | undefined;
  billing: BillingSettings | undefined;
  canReadCompany: boolean;
  canReadBilling: boolean;
}): HubReadinessItem[] {
  const items: HubReadinessItem[] = [];

  if (input.canReadCompany && input.company) {
    const ready = isCompanyIdentityReady(input.company);
    items.push({
      id: "identity",
      value: ready ? copy.identityReady : copy.identityPending,
      label: copy.identityLabel,
      status: ready ? "ok" : "empty",
      href: "/settings/general",
    });
  }

  if (input.canReadBilling && input.billing) {
    const certificate = resolveCertificateReadiness(input.billing);
    const numbering = resolveNumberingReadiness(input.billing);
    const pending =
      certificate.status === "pending" || numbering.status === "pending";
    const attention = !pending && certificate.status === "warning";

    items.push({
      id: "billing",
      value: pending
        ? copy.billingPending
        : attention
          ? copy.billingAttention
          : copy.billingReady,
      label: copy.billingLabel,
      status: pending ? "empty" : attention ? "warn" : "ok",
      href: "/settings/billing",
    });
  }

  return items;
}
