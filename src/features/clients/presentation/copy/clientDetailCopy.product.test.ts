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

  it("superficie sin CFDI ni persona moral/física (D5); ADR-0096 labels viven en cfdiReceptorProfileCopy", () => {
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

  it("identificación + envío: frecuencia, empty corto y sin lote/corrida (D1–D7)", () => {
    const id = clientDetailCopy.identification;
    const dispatch = clientDetailCopy.invoiceDispatch;

    expect(dispatch.title).toBe("Envío de facturas");
    expect(dispatch.description).toMatch(/correo del periodo/i);

    expect(id.billingScheme).toBe("Cada cuánto le mandamos las facturas");
    expect(id.billingSchemeNone).toBe("Sin frecuencia");
    expect(id.billingSchemeEmptyNote).toMatch(/envíos del periodo/i);
    expect(id.billingSchemeEmptyNote).toMatch(/Finanzas → Envíos → Pendientes/i);
    expect(id.billingSchemeHint).toMatch(/envíos del periodo/i);
    expect(id.billingSchemeHint).not.toMatch(/Por facturar/i);

    expect(id.invoiceAutoDispatch).toBe(
      "Mandar el correo del periodo sin confirmar",
    );
    expect(id.invoiceAutoDispatchOn).toBe("Sí, sin confirmar");
    expect(id.invoiceAutoDispatchOff).toBe("No — pide confirmación");
    expect(id.invoiceAutoDispatchNoSchemeTitle).not.toMatch(/esquema/i);
    expect(id.invoiceAutoDispatchNoSchemeText).toMatch(
      /automático no tiene efecto/i,
    );
    expect(id.invoiceAutoDispatchNoSchemeText).toMatch(/envíos del periodo/i);

    const surfaceBlob = [
      dispatch.title,
      dispatch.description,
      id.billingScheme,
      id.billingSchemeNone,
      id.billingSchemeEmptyNote,
      id.billingSchemeHint,
      id.invoiceAutoDispatch,
      id.invoiceAutoDispatchOn,
      id.invoiceAutoDispatchOff,
      id.invoiceAutoDispatchHint,
      id.invoiceAutoDispatchNoSchemeTitle,
      id.invoiceAutoDispatchNoSchemeText,
    ].join("\n");
    expect(surfaceBlob).not.toMatch(/\blote\b/i);
    expect(surfaceBlob).not.toMatch(/\bcorrida\b/i);
  });

  it("rol de contacto sin jerga Carta Porte en superficie (D5)", () => {
    expect(CLIENT_CONTACT_ROLE_LABELS.signsCartaPorte).toBe(
      "Firma documentos de viaje",
    );
  });
});

