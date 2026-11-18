import { describe, expect, it } from "vitest";
import {
  buildGpsActivationMailto,
  GPS_ACTIVATION_BILLING_EMAIL,
} from "./buildGpsActivationMailto";

describe("buildGpsActivationMailto", () => {
  it("builds exact PRD §X3 subject and body with RFC", () => {
    const href = buildGpsActivationMailto({
      companyName: "Transportes del Norte SA",
      rfc: "TNO010101ABC",
      userName: "Ana López",
      userEmail: "ana@norte.mx",
    });

    expect(href.startsWith(`mailto:${GPS_ACTIVATION_BILLING_EMAIL}?`)).toBe(
      true,
    );
    const url = new URL(href);
    expect(url.protocol).toBe("mailto:");
    expect(decodeURIComponent(url.searchParams.get("subject") ?? "")).toBe(
      "Solicitud de activación — Monitoreo GPS — Transportes del Norte SA",
    );
    expect(decodeURIComponent(url.searchParams.get("body") ?? "")).toBe(
      [
        "Hola Boeltech,",
        "",
        "Solicito la activación del complemento Monitoreo GPS.",
        "",
        "Empresa: Transportes del Norte SA",
        "RFC: TNO010101ABC",
        "Usuario: Ana López",
        "Correo: ana@norte.mx",
        "",
        "Quedo atento a la cotización según nuestra flota.",
      ].join("\n"),
    );
  });

  it("uses literal No disponible when RFC is missing", () => {
    const href = buildGpsActivationMailto({
      companyName: "Acme",
      rfc: null,
      userName: "Bob",
      userEmail: "bob@acme.mx",
    });
    const body = decodeURIComponent(
      new URL(href).searchParams.get("body") ?? "",
    );
    expect(body).toContain("RFC: No disponible");
    expect(body).not.toMatch(/precio|\$/i);
  });
});
