import { describe, expect, it } from "vitest";

import {
  PAC_PROVIDER_LABELS,
  PAC_USES_CREDENTIALS,
  PacProviders,
  resolveSelectablePacProvider,
  SELECTABLE_PAC_PROVIDERS,
} from "./entities";

describe("PAC providers (settings/billing)", () => {
  it("incluye solo Finkok como seleccionable", () => {
    expect(SELECTABLE_PAC_PROVIDERS).toEqual([PacProviders.FINKOK]);
  });

  it("no pide credenciales por tenant para Finkok", () => {
    expect(PAC_USES_CREDENTIALS[PacProviders.FINKOK]).toBe(false);
  });

  it("expone el nombre amigable Finkok", () => {
    expect(PAC_PROVIDER_LABELS[PacProviders.FINKOK]).toBe("Finkok");
  });

  it("resolveSelectablePacProvider conserva finkok y cae a Finkok si no es seleccionable", () => {
    expect(resolveSelectablePacProvider("finkok")).toBe(PacProviders.FINKOK);
    expect(resolveSelectablePacProvider("profact")).toBe(PacProviders.FINKOK);
    expect(resolveSelectablePacProvider("sw_sapien")).toBe(PacProviders.FINKOK);
    expect(resolveSelectablePacProvider(null)).toBe(PacProviders.FINKOK);
  });
});
