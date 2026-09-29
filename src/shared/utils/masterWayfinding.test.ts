import { describe, expect, it } from "vitest";
import {
  MASTER_WAYFINDING_COPY,
  resolveMasterBackHref,
  resolveMasterBackLabel,
} from "./masterWayfinding";
import { buildListHref } from "./listQueueFrom";

describe("masterWayfinding", () => {
  it("buildListHref conserva filtros", () => {
    const params = new URLSearchParams("status=inactive&page=2");
    expect(buildListHref("/branches", params)).toBe(
      "/branches?status=inactive&page=2",
    );
    expect(buildListHref("/clients", new URLSearchParams())).toBe("/clients");
  });

  it("cae al listado si from no es interno", () => {
    expect(resolveMasterBackHref("https://evil.example", "/branches")).toBe(
      "/branches",
    );
    expect(resolveMasterBackHref("/branches?status=inactive", "/branches")).toBe(
      "/branches?status=inactive",
    );
  });

  it("label según origen", () => {
    expect(
      resolveMasterBackLabel(
        "/branches?status=inactive",
        "/branches",
        "Volver a sucursales",
      ),
    ).toBe("Volver a sucursales");
    expect(
      resolveMasterBackLabel("/dashboard", "/drivers", "Volver a conductores"),
    ).toBe(MASTER_WAYFINDING_COPY.backToDashboard);
    expect(
      resolveMasterBackLabel(
        "/trips/trip-1?tab=operation",
        "/clients",
        "Volver a clientes",
      ),
    ).toBe(MASTER_WAYFINDING_COPY.backToTrip);
    expect(
      resolveMasterBackLabel("/branches/br-1", "/employees", "Volver a empleados"),
    ).toBe(MASTER_WAYFINDING_COPY.backToBranch);
  });
});
