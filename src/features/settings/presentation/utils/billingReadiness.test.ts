import { describe, expect, it } from "vitest";

import {
  CERTIFICATE_EXPIRY_WARNING_DAYS,
  resolveCertificateReadiness,
  resolveNumberingReadiness,
  resolveReadinessTone,
} from "./billingReadiness";

const NOW = new Date("2026-08-01T12:00:00.000Z");

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("resolveCertificateReadiness", () => {
  it("marca pendiente cuando no hay sello cargado", () => {
    const result = resolveCertificateReadiness(
      { certificateConfigured: false, certificateExpiry: null },
      NOW,
    );
    expect(result.status).toBe("pending");
    expect(result.expiresAt).toBeNull();
  });

  it("marca pendiente cuando el sello ya venció", () => {
    const result = resolveCertificateReadiness(
      { certificateConfigured: true, certificateExpiry: daysFromNow(-1) },
      NOW,
    );
    expect(result.status).toBe("pending");
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it("avisa con 60 días de anticipación", () => {
    const inside = resolveCertificateReadiness(
      {
        certificateConfigured: true,
        certificateExpiry: daysFromNow(CERTIFICATE_EXPIRY_WARNING_DAYS - 1),
      },
      NOW,
    );
    const outside = resolveCertificateReadiness(
      {
        certificateConfigured: true,
        certificateExpiry: daysFromNow(CERTIFICATE_EXPIRY_WARNING_DAYS + 1),
      },
      NOW,
    );

    expect(inside.status).toBe("warning");
    expect(outside.status).toBe("ready");
  });

  it("acepta un sello cargado sin fecha de vigencia", () => {
    const result = resolveCertificateReadiness(
      { certificateConfigured: true, certificateExpiry: null },
      NOW,
    );
    expect(result.status).toBe("ready");
  });
});

describe("resolveNumberingReadiness", () => {
  it("marca pendiente cuando falta la serie", () => {
    const result = resolveNumberingReadiness({
      serieFactura: "   ",
      folioInicial: 1,
    });
    expect(result.status).toBe("pending");
  });

  it("reporta la serie cuando está definida", () => {
    const result = resolveNumberingReadiness({
      serieFactura: "A",
      folioInicial: 1,
    });
    expect(result).toEqual({ status: "ready", serie: "A" });
  });
});

describe("resolveReadinessTone", () => {
  it("exige las dos comprobaciones para declarar listo para facturar", () => {
    expect(
      resolveReadinessTone({
        certificate: "ready",
        numbering: "ready",
        connection: "ready",
        emitter: "ready",
      }),
    ).toBe("ready");

    expect(
      resolveReadinessTone({
        certificate: "ready",
        numbering: "ready",
        connection: "unknown",
        emitter: "unknown",
      }),
    ).toBe("readyUnverified");
  });

  it("prioriza lo pendiente sobre el vencimiento próximo", () => {
    expect(
      resolveReadinessTone({
        certificate: "warning",
        numbering: "pending",
        connection: "unknown",
        emitter: "unknown",
      }),
    ).toBe("pending");

    expect(
      resolveReadinessTone({
        certificate: "warning",
        numbering: "ready",
        connection: "unknown",
        emitter: "unknown",
      }),
    ).toBe("attention");
  });

  it("trata una comprobación fallida como pendiente", () => {
    expect(
      resolveReadinessTone({
        certificate: "ready",
        numbering: "ready",
        connection: "pending",
        emitter: "unknown",
      }),
    ).toBe("pending");
  });
});
