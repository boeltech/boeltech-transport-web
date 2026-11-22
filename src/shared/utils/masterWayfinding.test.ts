import { describe, expect, it } from "vitest";
import {
  MASTER_WAYFINDING_COPY,
  MODULE_LIST_PATH_LABELS,
  resolveDetailCrumbs,
  resolveMasterBackHref,
  resolveMasterBackLabel,
  resolveModuleNavLabel,
} from "./masterWayfinding";
import { buildListHref } from "./listQueueFrom";

describe("masterWayfinding", () => {
  it("resolveModuleNavLabel mapea listado y detalle", () => {
    expect(resolveModuleNavLabel("/users")).toBe("Usuarios");
    expect(resolveModuleNavLabel("/users?create=1")).toBe("Usuarios");
    expect(resolveModuleNavLabel("/branches/br-1")).toBe("Sucursales");
    expect(resolveModuleNavLabel("/dashboard")).toBe("Inicio");
    expect(resolveModuleNavLabel("/no-existe")).toBeUndefined();
  });

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
    expect(
      resolveMasterBackLabel(
        "/employees/emp-1",
        "/drivers",
        "Volver a conductores",
      ),
    ).toBe(MASTER_WAYFINDING_COPY.backToEmployee);
  });
});

describe("resolveDetailCrumbs (Q1)", () => {
  const invoiceModule = {
    listPath: "/finance/invoices",
    label: MODULE_LIST_PATH_LABELS["/finance/invoices"]!,
  };
  const current = { label: "F-1211", mono: true as const };

  it("sin from → jerarquía del módulo", () => {
    expect(
      resolveDetailCrumbs({ module: invoiceModule, current }),
    ).toEqual([
      { label: "Facturas", to: "/finance/invoices" },
      { label: "F-1211", mono: true },
    ]);
  });

  it("from externo/inválido → jerarquía", () => {
    expect(
      resolveDetailCrumbs({
        from: "https://evil.example/x",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Facturas", to: "/finance/invoices" },
      { label: "F-1211", mono: true },
    ]);
    expect(
      resolveDetailCrumbs({
        from: "//evil.example",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Facturas", to: "/finance/invoices" },
      { label: "F-1211", mono: true },
    ]);
  });

  it("listado propio conserva filtros en to", () => {
    expect(
      resolveDetailCrumbs({
        from: "/finance/invoices?status=open&page=2",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Facturas", to: "/finance/invoices?status=open&page=2" },
      { label: "F-1211", mono: true },
    ]);
  });

  it("listado de otro módulo → 2 eslabones con label origen", () => {
    expect(
      resolveDetailCrumbs({
        from: "/trips?status=in_progress",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Viajes", to: "/trips?status=in_progress" },
      { label: "F-1211", mono: true },
    ]);
  });

  it("detalle de otro módulo → 3 con fromLabel; 2 sin fromLabel (sin duplicar)", () => {
    expect(
      resolveDetailCrumbs({
        from: "/trips/trip-1?tab=billing",
        fromLabel: "TRP-261118-0001",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Viajes", to: "/trips" },
      { label: "TRP-261118-0001", to: "/trips/trip-1?tab=billing" },
      { label: "F-1211", mono: true },
    ]);

    expect(
      resolveDetailCrumbs({
        from: "/trips/trip-1",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Viajes", to: "/trips/trip-1" },
      { label: "F-1211", mono: true },
    ]);
  });

  it("detalle vía alias (/invoices/:id) mapea a Facturas", () => {
    expect(
      resolveDetailCrumbs({
        from: "/invoices/inv-9",
        fromLabel: "F-009",
        module: {
          listPath: "/trips",
          label: "Viajes",
        },
        current: { label: "TRP-1", mono: true },
      }),
    ).toEqual([
      { label: "Facturas", to: "/finance/invoices" },
      { label: "F-009", to: "/invoices/inv-9" },
      { label: "TRP-1", mono: true },
    ]);
  });

  it("/dashboard → Inicio › actual", () => {
    expect(
      resolveDetailCrumbs({
        from: "/dashboard",
        module: { listPath: "/vehicles", label: "Vehículos" },
        current: { label: "ECO-12", mono: true },
      }),
    ).toEqual([
      { label: "Inicio", to: "/dashboard" },
      { label: "ECO-12", mono: true },
    ]);
  });

  it("rechaza from externo (allowlist vía resolveInternalAppHref)", () => {
    expect(
      resolveDetailCrumbs({
        from: "https://evil.example/dashboard",
        module: { listPath: "/vehicles", label: "Vehículos" },
        current: { label: "ECO-12", mono: true },
      }),
    ).toEqual([
      { label: "Vehículos", to: "/vehicles" },
      { label: "ECO-12", mono: true },
    ]);
    expect(
      resolveDetailCrumbs({
        from: "//evil.example/dashboard",
        module: { listPath: "/vehicles", label: "Vehículos" },
        current: { label: "ECO-12", mono: true },
      }),
    ).toEqual([
      { label: "Vehículos", to: "/vehicles" },
      { label: "ECO-12", mono: true },
    ]);
  });

  it("from desconocido interno sin match de módulo → jerarquía", () => {
    expect(
      resolveDetailCrumbs({
        from: "/unknown-module/x",
        module: invoiceModule,
        current,
      }),
    ).toEqual([
      { label: "Facturas", to: "/finance/invoices" },
      { label: "F-1211", mono: true },
    ]);
  });
});
