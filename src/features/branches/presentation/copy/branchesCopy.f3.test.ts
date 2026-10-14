import { describe, expect, it } from "vitest";

import { branchesCopy } from "./branchesCopy";

describe("branchesCopy F3 (D14)", () => {
  it("centraliza toasts de copiar dirección y aria", () => {
    expect(branchesCopy.detail.toasts.addressCopied).toBe("Dirección copiada");
    expect(branchesCopy.detail.toasts.addressCopyFailed).toBe(
      "No se pudo copiar",
    );
    expect(branchesCopy.detail.copyAddressAria).toBe("Copiar dirección");
  });

  it("usa sentence case en títulos del review del wizard", () => {
    const { review } = branchesCopy.form;
    expect(review.general).toBe("Datos generales");
    expect(review.contact).toBe("Contacto");
    expect(review.address).toBe("Dirección");
    expect(review.notes).toBe("Notas");
    for (const label of [
      review.general,
      review.contact,
      review.address,
      review.notes,
      review.code,
      review.name,
      review.status,
    ]) {
      expect(label).not.toBe(label.toUpperCase());
    }
  });
});
