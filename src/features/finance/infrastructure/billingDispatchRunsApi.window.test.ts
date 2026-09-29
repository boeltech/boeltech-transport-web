import { describe, expect, it } from "vitest";
import { mapBillingDispatchPeriodPreview, mapBillingDispatchRun } from "./billingDispatchRunsApi";
import type { DeepCamelCase } from "@shared/api";

describe("mapBillingDispatchRun period window", () => {
  it("maps additive window fields to camelCase", () => {
    const raw = {
      id: "run-1",
      tenantId: "t1",
      billingSchemeId: "s1",
      periodStart: "2026-04-18T06:00:00.000Z",
      periodEnd: "2026-04-25T06:00:00.000Z",
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
      createdAt: "2026-04-25T12:00:00.000Z",
      updatedAt: "2026-04-25T12:00:00.000Z",
      windowKind: "calendar_cut",
      cadenceKind: "periodic_weekly",
      inclusiveStart: "2026-04-18",
      inclusiveEnd: "2026-04-24",
      cutDate: "2026-04-25",
      windowHours: null,
    } as DeepCamelCase<{
      id: string;
      tenant_id: string;
      billing_scheme_id: string;
      period_start: string;
      period_end: string;
      anchor_kind: string;
      origin: string;
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
      window_kind: string;
      cadence_kind: string;
      inclusive_start: string;
      inclusive_end: string;
      cut_date: string;
      window_hours: null;
    }>;

    const run = mapBillingDispatchRun(raw);
    expect(run.windowKind).toBe("calendar_cut");
    expect(run.cadenceKind).toBe("periodic_weekly");
    expect(run.inclusiveStart).toBe("2026-04-18");
    expect(run.inclusiveEnd).toBe("2026-04-24");
    expect(run.cutDate).toBe("2026-04-25");
    expect(run.windowHours).toBeNull();
  });

  it("defaults missing window fields to null", () => {
    const raw = {
      id: "run-legacy",
      tenantId: "t1",
      billingSchemeId: "s1",
      periodStart: "2026-04-18T06:00:00.000Z",
      periodEnd: "2026-04-25T06:00:00.000Z",
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
      createdAt: "2026-04-25T12:00:00.000Z",
      updatedAt: "2026-04-25T12:00:00.000Z",
    } as DeepCamelCase<{
      id: string;
      tenant_id: string;
      billing_scheme_id: string;
      period_start: string;
      period_end: string;
      anchor_kind: string;
      origin: string;
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
    }>;

    const run = mapBillingDispatchRun(raw);
    expect(run.windowKind).toBeNull();
    expect(run.inclusiveStart).toBeNull();
    expect(run.cutDate).toBeNull();
    expect(run.windowHours).toBeNull();
  });
});

describe("mapBillingDispatchRun items", () => {
  it("maps origin and destination cities on pending stamp items", () => {
    const raw = {
      id: "run-1",
      tenantId: "t1",
      billingSchemeId: "s1",
      periodStart: "2026-04-18T06:00:00.000Z",
      periodEnd: "2026-04-25T06:00:00.000Z",
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
      createdAt: "2026-04-25T12:00:00.000Z",
      updatedAt: "2026-04-25T12:00:00.000Z",
      items: [
        {
          id: "item-1",
          itemKind: "pending_stamp",
          tripId: "c800a965-aaaa-bbbb-cccc-ddddeeee0001",
          invoiceId: null,
          billingScope: "primary_transport",
          clientId: "c1",
          clientName: "Organicos",
          clientRfc: "ONO120726RX3",
          originCity: "Monterrey",
          destinationCity: "Saltillo",
          invoiceDispatchSentAt: "2026-09-20T12:00:00.000Z",
          status: "listed",
          emailMessageId: null,
          errorMessage: null,
          sentAt: null,
          createdAt: "2026-04-25T12:00:00.000Z",
          updatedAt: "2026-04-25T12:00:00.000Z",
        },
      ],
    } as DeepCamelCase<{
      id: string;
      tenant_id: string;
      billing_scheme_id: string;
      period_start: string;
      period_end: string;
      anchor_kind: string;
      origin: string;
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
      items: unknown[];
    }>;

    const run = mapBillingDispatchRun(raw);
    expect(run.items?.[0]?.originCity).toBe("Monterrey");
    expect(run.items?.[0]?.destinationCity).toBe("Saltillo");
    expect(run.items?.[0]?.invoiceDispatchSentAt).toBe(
      "2026-09-20T12:00:00.000Z",
    );
  });
});

describe("mapBillingDispatchPeriodPreview", () => {
  it("maps period-preview snake_case to camelCase", () => {
    const preview = mapBillingDispatchPeriodPreview({
      billingSchemeId: "scheme-1",
      cadenceKind: "periodic_weekly",
      windowKind: "calendar_cut",
      timezone: "America/Mexico_City",
      periodStart: "2026-04-18T06:00:00.000Z",
      periodEnd: "2026-04-25T06:00:00.000Z",
      inclusiveStart: "2026-04-18",
      inclusiveEnd: "2026-04-24",
      cutDate: "2026-04-25",
      windowHours: null,
    });

    expect(preview.billingSchemeId).toBe("scheme-1");
    expect(preview.windowKind).toBe("calendar_cut");
    expect(preview.inclusiveStart).toBe("2026-04-18");
    expect(preview.inclusiveEnd).toBe("2026-04-24");
    expect(preview.cutDate).toBe("2026-04-25");
    expect(preview.windowHours).toBeNull();
  });
});
