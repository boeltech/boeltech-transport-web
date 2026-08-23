/**
 * Producto — handoff Capa 1 → Capa 3: léxico operativo del detalle de cliente.
 */
import { describe, expect, it } from "vitest";
import { CLIENT_CONTACT_ROLE_LABELS } from "../../domain";
import { clientDetailCopy } from "./clientDetailCopy";

describe("clientDetailCopy product handoff (Capa 1 → 3)", () => {
  it("tab Datos (no Cliente) y cue de edición (D2/D6)", () => {
    expect(clientDetailCopy.tabs.client).toBe("Datos");
    expect(clientDetailCopy.header.editCue).toMatch(/Editar/i);
    expect(clientDetailCopy.header.editCue).toMatch(/Contactos y direcciones/i);
  });

  it("superficie sin CFDI ni persona moral/física (D5)", () => {
    const blob = JSON.stringify(clientDetailCopy);
    expect(blob).not.toMatch(/CFDI/i);
    expect(blob).not.toMatch(/persona moral/i);
    expect(blob).not.toMatch(/persona física/i);
    expect(blob).not.toMatch(/domicilio fiscal/i);
    expect(blob).not.toMatch(/Factura timbrada/i);
  });

  it("grupos de dirección y empty read-only operativos (D5/D6)", () => {
    expect(clientDetailCopy.address.groups.fiscal).toBe("Facturación");
    expect(clientDetailCopy.address.emptyDescriptionReadOnly).not.toMatch(
      /Editar cliente/i,
    );
    expect(clientDetailCopy.address.emptyHints.fiscal).toMatch(/facturar/i);
  });

  it("rol de contacto sin jerga Carta Porte en superficie (D5)", () => {
    expect(CLIENT_CONTACT_ROLE_LABELS.signsCartaPorte).toBe(
      "Firma documentos de viaje",
    );
  });
});
