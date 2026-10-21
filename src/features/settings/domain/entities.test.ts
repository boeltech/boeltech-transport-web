import { describe, expect, it } from "vitest";

import {
  PAC_PROVIDER_LABELS,
  PAC_USES_CREDENTIALS,
  PacProviders,
  resolveSelectablePacProvider,
  SELECTABLE_PAC_PROVIDERS,
} from "./entities";

describe("PAC providers (settings/billing)", () => {
  it("incluye ProFact y Finkok como seleccionables", () => {
    expect(SELECTABLE_PAC_PROVIDERS).toEqual([
      PacProviders.PROFACT,
      PacProviders.FINKOK,
    ]);
  });

  it("no pide credenciales por tenant para ProFact ni Finkok", () => {
    expect(PAC_USES_CREDENTIALS[PacProviders.PROFACT]).toBe(false);
    expect(PAC_USES_CREDENTIALS[PacProviders.FINKOK]).toBe(false);
  });

  it("expone el nombre amigable Finkok", () => {
    expect(PAC_PROVIDER_LABELS[PacProviders.FINKOK]).toBe("Finkok");
  });

  it("resolveSelectablePacProvider conserva finkok y cae a ProFact si no es seleccionable", () => {
    expect(resolveSelectablePacProvider("finkok")).toBe(PacProviders.FINKOK);
    expect(resolveSelectablePacProvider("profact")).toBe(PacProviders.PROFACT);
    expect(resolveSelectablePacProvider("sw_sapien")).toBe(PacProviders.PROFACT);
    expect(resolveSelectablePacProvider(null)).toBe(PacProviders.PROFACT);
  });
});
