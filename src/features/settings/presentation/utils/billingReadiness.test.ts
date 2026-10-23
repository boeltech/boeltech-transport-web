import { describe, expect, it } from "vitest";

import { FinkokEmitterStatuses } from "../../domain";
import {
  CERTIFICATE_EXPIRY_WARNING_DAYS,
  isBillingCoreReady,
  resolveCertificateReadiness,
  resolveFinkokEmitterCta,
  resolveFinkokEmitterReadiness,
  resolveIdentityReadiness,
  resolveNumberingReadiness,
  resolveReadinessTone,
} from "./billingReadiness";

const NOW = new Date("2026-08-01T12:00:00.000Z");

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("resolveIdentityReadiness", () => {
  it("marca pendiente cuando falta un dato de identidad", () => {
    expect(
      resolveIdentityReadiness(
        {
          legalName: "Demo",
          rfc: "TAB123456XYZ",
          regimenFiscal: "",
          lugarExpedicion: "03100",
        },
        { known: true },
      ).status,
    ).toBe("pending");
  });

  it("marca listo con identidad mínima", () => {
    expect(
      resolveIdentityReadiness(
        {
          legalName: "Demo",
          rfc: "TAB123456XYZ",
          regimenFiscal: "601",
          lugarExpedicion: "03100",
        },
        { known: true },
      ).status,
    ).toBe("ready");
  });

  it("queda unknown hasta que se conoce el GET de empresa", () => {
    expect(resolveIdentityReadiness(undefined, { known: false }).status).toBe(
      "unknown",
    );
  });
});

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

describe("resolveFinkokEmitterReadiness", () => {
  it("oculta el paso cuando el flag está off", () => {
    const result = resolveFinkokEmitterReadiness({
      finkokRegistrationEnabled: false,
      finkokEmitter: {
        status: FinkokEmitterStatuses.READY,
        detail: null,
        checkedAt: null,
        taxpayerId: "AAA010101AAA",
        registrationEnabled: false,
      },
    });
    expect(result.visible).toBe(false);
    expect(result.blocksReady).toBe(false);
  });

  it("trata cache vacía con flag on como no_registrado bloqueante", () => {
    const result = resolveFinkokEmitterReadiness({
      finkokRegistrationEnabled: true,
      finkokEmitter: null,
    });
    expect(result.visible).toBe(true);
    expect(result.status).toBe(FinkokEmitterStatuses.NOT_REGISTERED);
    expect(result.blocksReady).toBe(true);
  });

  it("no bloquea cuando el RFC está ready", () => {
    const result = resolveFinkokEmitterReadiness({
      finkokRegistrationEnabled: true,
      finkokEmitter: {
        status: FinkokEmitterStatuses.READY,
        detail: null,
        checkedAt: "2026-10-23T15:00:00.000Z",
        taxpayerId: "AAA010101AAA",
        registrationEnabled: true,
      },
    });
    expect(result.blocksReady).toBe(false);
    expect(result.rowStatus).toBe("ready");
  });
});

describe("resolveFinkokEmitterCta", () => {
  it("ofrece reintentar en no_registrado y error; solo verificar en suspendido", () => {
    expect(
      resolveFinkokEmitterCta(FinkokEmitterStatuses.NOT_REGISTERED),
    ).toBe("register");
    expect(resolveFinkokEmitterCta(FinkokEmitterStatuses.ERROR)).toBe(
      "register",
    );
    expect(resolveFinkokEmitterCta(FinkokEmitterStatuses.SUSPENDED)).toBe(
      "verifyStatus",
    );
    expect(resolveFinkokEmitterCta(FinkokEmitterStatuses.READY)).toBeNull();
    expect(
      resolveFinkokEmitterCta(FinkokEmitterStatuses.READY, {
        includeReadyVerify: true,
      }),
    ).toBe("verify");
  });
});

describe("resolveReadinessTone", () => {
  it("exige identidad en el núcleo pendiente", () => {
    expect(
      resolveReadinessTone({
        identity: "pending",
        certificate: "ready",
        numbering: "ready",
        connection: "unknown",
      }),
    ).toBe("pending");
  });

  it("exige la comprobación de conexión para declarar listo para facturar", () => {
    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        connection: "ready",
      }),
    ).toBe("ready");

    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        connection: "unknown",
      }),
    ).toBe("readyUnverified");
  });

  it("A3: bloquea ready/readyUnverified si el RFC no está listo", () => {
    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        connection: "ready",
        finkokEmitterBlocksReady: true,
      }),
    ).toBe("pending");

    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        connection: "unknown",
        finkokEmitterBlocksReady: true,
      }),
    ).toBe("pending");

    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        connection: "ready",
        finkokEmitterBlocksReady: false,
      }),
    ).toBe("ready");
  });

  it("prioriza lo pendiente sobre el vencimiento próximo", () => {
    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "warning",
        numbering: "pending",
        connection: "unknown",
      }),
    ).toBe("pending");

    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "warning",
        numbering: "ready",
        connection: "unknown",
      }),
    ).toBe("attention");
  });

  it("trata una comprobación fallida como pendiente", () => {
    expect(
      resolveReadinessTone({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        connection: "pending",
      }),
    ).toBe("pending");
  });
});

describe("isBillingCoreReady", () => {
  it("acepta sello en warning como núcleo listo", () => {
    expect(
      isBillingCoreReady({
        identity: "ready",
        certificate: "warning",
        numbering: "ready",
      }),
    ).toBe(true);
  });

  it("falla sin identidad", () => {
    expect(
      isBillingCoreReady({
        identity: "pending",
        certificate: "ready",
        numbering: "ready",
      }),
    ).toBe(false);
  });

  it("A3: falla si el RFC bloquea", () => {
    expect(
      isBillingCoreReady({
        identity: "ready",
        certificate: "ready",
        numbering: "ready",
        finkokEmitterBlocksReady: true,
      }),
    ).toBe(false);
  });
});
