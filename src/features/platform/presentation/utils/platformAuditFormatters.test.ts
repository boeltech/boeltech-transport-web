import { describe, expect, it } from "vitest";
import {
  PlatformAuditAction,
  type PlatformAuditLogItem,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
  getAuditOperatorLabel,
  getAuditTenantLabel,
  isDestructiveAuditAction,
} from "./platformAuditFormatters";
import { formatBillingPriceCents } from "./platformBillingFormatters";

function baseItem(
  overrides: Partial<PlatformAuditLogItem> &
    Pick<PlatformAuditLogItem, "action" | "metadata">,
): PlatformAuditLogItem {
  return {
    id: "a1",
    platformUserId: "u1",
    platformUserEmail: "ops@boeltech.com",
    targetTenantId: "t1",
    targetTenantSubdomain: null,
    targetTenantName: null,
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
    expect(getAuditActionLabel("saas_invoice_auto_issue_sweep")).toBe(
      "Barrido de emisión",
    );
    expect(getAuditActionLabel("saas_invoice_auto_charge_sweep")).toBe(
      "Barrido de cobro",
    );
  });

  it("labels stripe, approval, demo and restored subscription actions", () => {
    expect(getAuditActionLabel("saas_stripe_charge_failed")).toBe(
      "Cobro con tarjeta rechazado",
    );
    expect(getAuditActionLabel("saas_stripe_charge_requires_action")).toBe(
      "Cobro requiere autenticación",
    );
    expect(getAuditActionLabel("tenant_approval_policies_viewed")).toBe(
      "Reglas de autorización consultadas",
    );
    expect(getAuditActionLabel("tenant_demo_seed_applied")).toBe(
      "Datos de ejemplo cargados",
    );
    expect(
      getAuditActionLabel(
        PlatformAuditAction.SUBSCRIPTION_ACTIVE_RESTORED_AUTO,
      ),
    ).toBe("Suscripción → activa (auto)");
    expect(getAuditActionLabel(PlatformAuditAction.TENANT_VIEWED)).toBe(
      "Empresa consultada",
    );
    expect(getAuditActionLabel(PlatformAuditAction.PLATFORM_PULSE_VIEWED)).toBe(
      "Pulso consultado",
    );
    expect(
      getAuditActionLabel(
        PlatformAuditAction.PLATFORM_BILLING_RECONCILIATION_VIEWED,
      ),
    ).toBe("Conciliación de cobro consultada");
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.PLATFORM_BILLING_RECONCILIATION_VIEWED,
          metadata: {
            format: "csv",
            period_key: "2026-10",
            tenant_id: "t1",
            total_cents: 150000,
          },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);
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
    ).toBe(platformCopy.audit.noDetail);
  });

  it("summarizes a declined card charge without gateway ids or the failure message", () => {
    const amount = formatBillingPriceCents(197200);
    const summary = getAuditMetadataSummary(
      baseItem({
        action: "saas_stripe_charge_failed",
        metadata: {
          gateway_payment_id: "pi_secret_123",
          failure_code: "card_declined",
          failure_message: "Your card was declined",
          amount_cents: 197200,
          event_id: "evt_999",
        },
      }),
    );
    expect(summary).toContain(amount);
    expect(summary).toContain("card_declined");
    expect(summary).toBe(`${amount} · card_declined`);
    expect(summary).not.toContain("Your card was declined");
    expect(summary).not.toContain("pi_secret_123");
    expect(summary).not.toContain("evt_999");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "saas_stripe_charge_failed",
          metadata: {
            event_id: "evt_webhook",
            gateway_payment_id: "pi_webhook",
            amount_cents: 5000,
          },
        }),
      ),
    ).toBe(formatBillingPriceCents(5000));

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "saas_stripe_charge_failed",
          metadata: { failure_code: "insufficient_funds" },
        }),
      ),
    ).toBe("insufficient_funds");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "saas_stripe_charge_failed",
          metadata: {
            gateway_payment_id: "pi_only",
            failure_message: "do not show",
          },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);
  });

  it("summarizes a charge that requires authentication as the amount only", () => {
    const amount = formatBillingPriceCents(2500);
    const summary = getAuditMetadataSummary(
      baseItem({
        action: "saas_stripe_charge_requires_action",
        metadata: {
          gateway_payment_id: "pi_action_1",
          amount_cents: 2500,
        },
      }),
    );
    expect(summary).toBe(amount);
    expect(summary).not.toContain("pi_action_1");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "saas_stripe_charge_requires_action",
          metadata: { gateway_payment_id: "pi_action_2" },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);
  });

  it("hides approval-policy view metadata and summarizes demo seed by draft trip", () => {
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "tenant_approval_policies_viewed",
          metadata: { concepts: ["settlement", "advance"] },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);

    const withDraft = getAuditMetadataSummary(
      baseItem({
        action: "tenant_demo_seed_applied",
        metadata: { pack: "demo_ops_v1", include_draft_trip: true },
      }),
    );
    expect(withDraft).toBe("Con viaje en borrador");
    expect(withDraft).not.toContain("demo_ops_v1");

    const withoutDraft = getAuditMetadataSummary(
      baseItem({
        action: "tenant_demo_seed_applied",
        metadata: { pack: "demo_ops_v1", include_draft_trip: false },
      }),
    );
    expect(withoutDraft).toBe("Sin viaje en borrador");
    expect(withoutDraft).not.toContain("demo_ops_v1");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "tenant_demo_seed_applied",
          metadata: { pack: "demo_ops_v1" },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);
  });

  it("does not mark the new audit verbs as destructive", () => {
    for (const action of [
      "saas_stripe_charge_failed",
      "saas_stripe_charge_requires_action",
      "tenant_approval_policies_viewed",
      "tenant_demo_seed_applied",
      PlatformAuditAction.SUBSCRIPTION_ACTIVE_RESTORED_AUTO,
    ]) {
      expect(
        isDestructiveAuditAction(baseItem({ action, metadata: {} })),
      ).toBe(false);
    }
  });

  it("falls back to the raw action and noDetail for unknown actions", () => {
    expect(getAuditActionLabel("unknown_future_action")).toBe(
      "unknown_future_action",
    );
    expect(
      getAuditMetadataSummary(
        baseItem({
          action: "unknown_future_action",
          metadata: { foo: "bar" },
        }),
      ),
    ).toBe(platformCopy.audit.noDetail);
  });

  it("appends admin_email to tenant created and self-serve summaries", () => {
    const plans = [{ code: "operacion_esencial", name: "Operación Esencial" }];
    const created = baseItem({
      action: PlatformAuditAction.TENANT_CREATED,
      metadata: {
        subdomain: "acme",
        plan_code: "operacion_esencial",
        admin_email: "admin@acme.mx",
      },
    });

    expect(getAuditMetadataSummary(created, plans)).toBe(
      "acme · Operación Esencial · admin@acme.mx",
    );
    expect(getAuditOperatorLabel(created)).toBe("ops@boeltech.com");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_CREATED,
          metadata: {
            subdomain: "acme",
            admin_email: "admin@acme.mx",
          },
        }),
        plans,
      ),
    ).toBe("acme · admin@acme.mx");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_CREATED,
          metadata: {
            subdomain: "acme",
            plan_code: "operacion_esencial",
          },
        }),
        plans,
      ),
    ).toBe("acme · Operación Esencial");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_CREATED,
          metadata: { subdomain: "acme", admin_email: "   " },
        }),
      ),
    ).toBe("acme");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED,
          metadata: {
            subdomain: "acme",
            plan_code: "operacion_esencial",
            admin_email: "admin@acme.mx",
          },
        }),
        plans,
      ),
    ).toBe("acme · Operación Esencial · admin@acme.mx");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED,
          metadata: { subdomain: "acme", admin_email: "admin@acme.mx" },
        }),
      ),
    ).toBe("acme · admin@acme.mx");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED,
          metadata: { subdomain: "acme", plan_code: "operacion_esencial" },
        }),
        plans,
      ),
    ).toBe("acme · Operación Esencial · en prueba");

    expect(
      getAuditMetadataSummary(
        baseItem({
          action: PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED,
          metadata: { subdomain: "acme" },
        }),
      ),
    ).toBe("acme · en prueba");
  });

  describe("getAuditTenantLabel", () => {
    it("prefers targetTenantSubdomain when metadata is empty", () => {
      expect(
        getAuditTenantLabel(
          baseItem({
            action: PlatformAuditAction.SAAS_INVOICE_PAID,
            targetTenantSubdomain: "acme",
            targetTenantName: "Acme SA",
            metadata: {},
          }),
        ),
      ).toBe("acme");
    });

    it("falls back to metadata.subdomain when API subdomain is missing", () => {
      expect(
        getAuditTenantLabel(
          baseItem({
            action: PlatformAuditAction.TENANT_CREATED,
            targetTenantSubdomain: null,
            metadata: { subdomain: "legacy-co" },
          }),
        ),
      ).toBe("legacy-co");
    });

    it("marks void, revoke, and suspend as destructive verbs", () => {
      expect(
        isDestructiveAuditAction(
          baseItem({
            action: PlatformAuditAction.SAAS_INVOICE_VOIDED,
            metadata: {},
          }),
        ),
      ).toBe(true);
      expect(
        isDestructiveAuditAction(
          baseItem({
            action: PlatformAuditAction.TENANT_STATUS_CHANGED,
            metadata: { status: "suspended" },
          }),
        ),
      ).toBe(true);
      expect(
        isDestructiveAuditAction(
          baseItem({
            action: PlatformAuditAction.TENANT_STATUS_CHANGED,
            metadata: { status: "active" },
          }),
        ),
      ).toBe(false);
      expect(
        isDestructiveAuditAction(
          baseItem({
            action: PlatformAuditAction.TENANT_PLAN_ASSIGNED,
            metadata: {},
          }),
        ),
      ).toBe(false);
    });

    it("returns unknownTenant when only targetTenantId is present", () => {
      expect(
        getAuditTenantLabel(
          baseItem({
            action: PlatformAuditAction.SAAS_INVOICE_PAID,
            targetTenantId: "t1",
            targetTenantSubdomain: null,
            targetTenantName: null,
            metadata: {},
          }),
        ),
      ).toBe(platformCopy.audit.unknownTenant);
    });
  });
});
