import { describe, expect, it } from "vitest";
import { buildSupportMailto } from "./buildSupportMailto";

describe("buildSupportMailto", () => {
  it("builds mailto with subject, body and support context", () => {
    const href = buildSupportMailto({
      supportEmail: "soporte@boeltech.com",
      productName: "Tlama",
      tenantName: "Transportes Demo",
      userEmail: "admin@demo.com",
      currentPath: "/invoices/abc",
      environment: "staging",
      release: "abc1234",
    });

    expect(href.startsWith("mailto:soporte@boeltech.com?")).toBe(true);
    expect(href).toContain("subject=");
    expect(href).toContain("Ayuda%20Tlama");
    expect(href).toContain("Transportes%20Demo");
    expect(href).toContain("admin%40demo.com");
    expect(href).toContain("%2Finvoices%2Fabc");
    expect(href).toContain("staging");
    expect(href).toContain("abc1234");
  });

  it("falls back when tenant or email are missing", () => {
    const href = buildSupportMailto({
      supportEmail: "soporte@boeltech.com",
      productName: "Tlama",
      currentPath: "/",
      environment: "development",
      release: "local",
    });

    expect(href).toContain("subject=Ayuda%20Tlama");
    expect(href).not.toContain("subject=Ayuda%20Tlama%20");
    expect(href).toContain("Empresa%3A%20");
  });
});
