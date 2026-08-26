import { describe, it, expect } from "vitest";
import { mapBillingDispatchRun } from "./billingDispatchRunsApi";
import type { DeepCamelCase } from "@shared/api";

describe("mapBillingDispatchRun recipients", () => {
  it("maps recipients_by_client and client_receipts", () => {
    const raw = {
      id: "run-1",
      tenantId: "t1",
      billingSchemeId: "s1",
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-08T00:00:00.000Z",
      anchorKind: "trip_completed",
      origin: "manual",
      status: "previewed",
      previewedAt: null,
      sendConfirmedAt: null,
      sendConfirmedBy: null,
      completedAt: null,
      failedAt: null,
      errorSummary: null,
      createdBy: "u1",
      createdAt: "2026-08-08T00:00:00.000Z",
      updatedAt: "2026-08-08T00:00:00.000Z",
      recipientsByClient: [
        {
          clientId: "c1",
          clientName: "Acme",
          recipients: [
            {
              key: "billing_email",
              kind: "billing_email",
              label: "Correo de facturación",
              email: "bill@acme.test",
            },
            {
              key: "contact:x",
              kind: "contact",
              contactId: "x",
              label: "Ana",
              email: "ana@acme.test",
            },
          ],
        },
      ],
      clientReceipts: null,
    } as DeepCamelCase<{
      id: string;
      tenant_id: string;
      billing_scheme_id: string;
      period_start: string;
      period_end: string;
      anchor_kind: string;
      status: string;
      previewed_at: null;
      send_confirmed_at: null;
      send_confirmed_by: null;
      completed_at: null;
      failed_at: null;
      error_summary: null;
      created_by: string;
      created_at: string;
      updated_at: string;
      recipients_by_client: unknown[];
      client_receipts: null;
    }>;

    const run = mapBillingDispatchRun(raw);
    expect(run.recipientsByClient?.[0]?.recipients).toHaveLength(2);
    expect(run.recipientsByClient?.[0]?.recipients[1]?.contactId).toBe("x");
    expect(run.clientReceipts).toBeNull();
  });
});
