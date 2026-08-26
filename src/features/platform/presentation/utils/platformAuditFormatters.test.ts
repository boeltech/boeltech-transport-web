import { describe, expect, it } from "vitest";
import {
  PlatformAuditAction,
  type PlatformAuditLogItem,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
} from "./platformAuditFormatters";

function baseItem(
  overrides: Partial<PlatformAuditLogItem> &
    Pick<PlatformAuditLogItem, "action" | "metadata">,
): PlatformAuditLogItem {
  return {
    id: "a1",
    platformUserId: "u1",
    platformUserEmail: "ops@boeltech.com",
    targetTenantId: "t1",
    targetType: "tenant",
    targetId: "t1",
    createdAt: "2026-08-25T18:00:00.000Z",
    ...overrides,
  };
}

describe("platformAuditFormatters", () => {
  it("labels activation actions in Spanish (not raw snake_case)", () => {
    expect(
      getAuditActionLabel(PlatformAuditAction.TENANT_ADMIN_ACTIVATION_SENT),
    ).toBe(platformCopy.audit.actions.tenant_admin_activation_sent);
    expect(
      getAuditActionLabel(PlatformAuditAction.TENANT_ADMIN_ACTIVATION_RESENT),
    ).toBe(platformCopy.audit.actions.tenant_admin_activation_resent);
    expect(
      getAuditActionLabel(PlatformAuditAction.TENANT_ADMIN_ACTIVATED),
    ).toBe(platformCopy.audit.actions.tenant_admin_activated);
    expect(
      getAuditActionLabel(PlatformAuditAction.TENANT_ADMIN_CREDENTIALS_ROTATED),
    ).toBe(platformCopy.audit.actions.tenant_admin_credentials_rotated);
  });

  it("summarizes activation sent with email and optional send failure", () => {
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_ADMIN_ACTIVATION_SENT,
          metadata: { email: "admin@acme.com", activation_id: "act-1" },
        }),
      ),
    ).toBe("Email: admin@acme.com");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_ADMIN_ACTIVATION_SENT,
          metadata: {
            email: "admin@acme.com",
            send_failed: true,
          },
        }),
      ),
    ).toContain("envío fallido");
  });

  it("summarizes credentials rotated with optional resend flag", () => {
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_ADMIN_CREDENTIALS_ROTATED,
          metadata: {
            email: "admin@acme.com",
            resend_activation: true,
          },
        }),
      ),
    ).toBe("Rotadas · admin@acme.com · reenvío");
  });

  it("summarizes saas_invoice_issued with period and total", () => {
    const summary = getAuditMetadataSummary(
      baseItem({
        action: PlatformAuditAction.SAAS_INVOICE_ISSUED,
        metadata: {
          period_key: "2026-07",
          total_cents: 174000,
          status: "open",
        },
      }),
    );
    expect(summary).toContain("2026-07");
    expect(summary).toMatch(/1[,.]740\.00/);
  });

  it("summarizes saas_invoice_paid / voided / past_due auto", () => {
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.SAAS_INVOICE_PAID,
          metadata: { total_cents: 10000, method: "transfer" },
        }),
      ),
    ).toContain("transfer");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.SAAS_INVOICE_VOIDED,
          metadata: { void_reason: "Duplicado" },
        }),
      ),
    ).toBe("Anulado · Duplicado");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.SUBSCRIPTION_PAST_DUE_AUTO,
          metadata: { overdue_open_count: 2 },
        }),
      ),
    ).toContain("2");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.SUBSCRIPTION_ACTIVE_RESTORED_AUTO,
          metadata: {},
        }),
      ),
    ).toBe("Suscripción → active");
  });

  it("falls back to noDetail for unknown actions", () => {
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "unknown_future_action",
          metadata: { foo: "bar" },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);
  });
});
