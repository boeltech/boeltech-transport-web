import { describe, expect, it } from "vitest";
import {
  buildDayLine,
  compareAttentionRows,
  formatApprovalsBreakdown,
  formatAttentionEyebrow,
  formatDocumentExpiryBreakdown,
  formatOverdueTripsBreakdown,
} from "./attentionQueue";

describe("compareAttentionRows", () => {
  it("ordena critical → warning → info y empate por área", () => {
    const rows = [
      { urgency: "info" as const, area: "Facturación" as const },
      { urgency: "warning" as const, area: "Cobranza" as const },
      { urgency: "warning" as const, area: "Operación" as const },
      { urgency: "critical" as const, area: "Flota" as const },
    ];
    const sorted = [...rows].sort(compareAttentionRows);
    expect(sorted.map((r) => `${r.urgency}:${r.area}`)).toEqual([
      "critical:Flota",
      "warning:Operación",
      "warning:Cobranza",
      "info:Facturación",
    ]);
  });
});

describe("buildDayLine", () => {
  it("cuenta nueva", () => {
    expect(buildDayLine({ pendingCount: 0, activationPendingSteps: 3 })).toBe(
      "Te faltan 3 pasos para crear tu primer viaje en tlamx.",
    );
  });

  it("pendientes con urgente", () => {
    expect(
      buildDayLine({
        pendingCount: 7,
        topDetail: "2 viajes con retraso",
      }),
    ).toBe("Tienes 7 pendientes. Lo más urgente: 2 viajes con retraso.");
  });

  it("al día ops", () => {
    expect(
      buildDayLine({
        pendingCount: 0,
        allClear: { mode: "ops", tripsToday: 17, inProgress: 7 },
      }),
    ).toBe("Estás al día. Hoy hay 17 viajes: 7 en ruta.");
  });
});

describe("formatters", () => {
  it("approvals / overdue / docs", () => {
    expect(
      formatApprovalsBreakdown({
        trip_expense: 2,
        driver_advance_request: 1,
      }),
    ).toBe("2 gastos de viaje · 1 anticipos");
    expect(formatOverdueTripsBreakdown(1, 1)).toBe(
      "1 no ha salido · 1 llegada tarde",
    );
    expect(
      formatDocumentExpiryBreakdown({
        byType: {
          license: 2,
          medicalCertificate: 0,
          insurance: 1,
          sctPermit: 0,
        },
        withinDays: 30,
        expired: 1,
      }),
    ).toBe("1 vencido · 2 licencias · 1 seguros · en los próximos 30 días");
  });

  it("eyebrow incluye Todas las sucursales", () => {
    expect(formatAttentionEyebrow(new Date("2026-11-16T18:00:00-06:00"))).toMatch(
      /Todas las sucursales$/,
    );
  });
});
