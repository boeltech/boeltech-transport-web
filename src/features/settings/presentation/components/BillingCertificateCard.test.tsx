import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { BillingSettings } from "../../domain";
import type { CertificateReadiness } from "../utils/billingReadiness";
import { BillingCertificateCard } from "./BillingCertificateCard";

vi.mock("../../application/hooks", () => ({
  useUploadCertificate: () => ({ mutate: vi.fn(), isPending: false }),
}));

const baseSettings = {
  certificateConfigured: false,
  certificateExpiry: null,
  certificateKind: null,
} as BillingSettings;

const pendingMissing: CertificateReadiness = {
  status: "pending",
  expiresAt: null,
  daysRemaining: null,
  kindIssue: null,
};

describe("BillingCertificateCard", () => {
  it("muestra el helper PRD §E-b siempre visible", () => {
    render(
      <BillingCertificateCard
        settings={baseSettings}
        readiness={pendingMissing}
        canUpload
        showRestrictionNotice={false}
      />,
    );

    expect(
      screen.getByText(
        "Usa el CSD (.cer y .key) del RFC de tu empresa, no la e.firma / FIEL de trámites.",
      ),
    ).toBeInTheDocument();
  });

  it("mantiene el helper visible sin permiso de carga", () => {
    render(
      <BillingCertificateCard
        settings={baseSettings}
        readiness={pendingMissing}
        canUpload={false}
        showRestrictionNotice
      />,
    );

    expect(
      screen.getByText(
        "Usa el CSD (.cer y .key) del RFC de tu empresa, no la e.firma / FIEL de trámites.",
      ),
    ).toBeInTheDocument();
  });
});
