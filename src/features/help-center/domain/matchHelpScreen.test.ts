/**
 * Parity twin: boeltech-transport-api/src/modules/help-center/domain/matchHelpScreen.ts
 *
 * Mirror cases: PRD §G + N1, N3, N4 + A5 (R-SPEC / R-VIEW / R-LIST).
 * Where §H asks for equalized sort_order, the matcher filter is independent of
 * sort — residual ordering is the caller's job (repo SQL / selectPrimary).
 */
import { describe, expect, it } from "vitest";
import {
  filterArticlesByMaxScreenScore,
  matchHelpScreen,
  scoreHelpScreen,
} from "./matchHelpScreen";

type Fixture = {
  id: string;
  screens: readonly string[];
  sortOrder: number;
};

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

/** Competing articles for §G / §H with sort_order equalized where it matters. */
const ARTICLES: Fixture[] = [
  {
    id: "registrar-anticipo-operador",
    screens: ["/finance/operator-payments/advances"],
    sortOrder: 130,
  },
  {
    id: "perfil-pago-operador",
    screens: ["/finance/operator-payments/operators"],
    sortOrder: 130,
  },
  {
    id: "esquema-compensacion",
    screens: [
      "/finance/operator-payments/tariffs",
      "/finance/operator-payments/tariffs/:id/build",
    ],
    sortOrder: 130,
  },
  {
    id: "liquidar-viaje",
    screens: [
      "/finance/operator-payments",
      "/finance/operator-payments/new",
      "/finance/operator-payments/:id",
    ],
    sortOrder: 130,
  },
  {
    id: "cargar-flota-clientes",
    screens: [
      "/vehicles",
      "/vehicles/new",
      "/trailers",
      "/trailers/new",
      "/drivers",
      "/drivers/new",
    ],
    sortOrder: 45,
  },
  {
    id: "corregir-ficha-flota",
    screens: [
      "/vehicles/:id",
      "/vehicles/:id/edit",
      "/trailers/:id",
      "/trailers/:id/edit",
      "/drivers/:id",
      "/drivers/:id/edit",
    ],
    sortOrder: 45,
  },
  {
    id: "alta-cliente",
    screens: ["/clients", "/clients/new"],
    sortOrder: 70,
  },
  {
    id: "ficha-cliente",
    screens: ["/clients/:id", "/clients/:id/edit"],
    sortOrder: 70,
  },
  {
    id: "alta-usuarios-rol",
    screens: ["/users/new"],
    sortOrder: 60,
  },
  {
    id: "revisar-historial-usuarios",
    screens: ["/users/activity"],
    sortOrder: 60,
  },
  {
    id: "usuarios-configuracion",
    screens: ["/users", "/users/:id"],
    sortOrder: 60,
  },
  {
    id: "abrir-sucursal",
    screens: ["/branches/new", "/branches/:id/edit"],
    sortOrder: 60,
  },
  {
    id: "consultar-sucursales",
    screens: ["/branches", "/branches/:id"],
    sortOrder: 60,
  },
  {
    id: "consultar-tendencia",
    screens: ["/finance/analysis", "/finance/analysis?view=performance"],
    sortOrder: 145,
  },
  {
    id: "ver-rentabilidad",
    screens: ["/finance/analysis?view=margin"],
    sortOrder: 145,
  },
  {
    id: "revisar-gasto-viaje",
    screens: ["/finance/analysis?view=expenses"],
    sortOrder: 145,
  },
  {
    id: "reservar-viaje",
    screens: ["/trips", "/trips/new"],
    sortOrder: 50,
  },
  {
    id: "seguir-viaje",
    screens: ["/trips/:id"],
    sortOrder: 50,
  },
  {
    id: "confirmar-reserva",
    screens: ["/trips/:id"],
    sortOrder: 50,
  },
  {
    id: "despachar-facturas",
    screens: ["/finance/dispatch/period", "/finance/dispatch/:id"],
    sortOrder: 100,
  },
];

function winners(screen: string): string[] {
  return filterArticlesByMaxScreenScore(screen, ARTICLES).map((a) => a.id);
}

describe("matchHelpScreen (legacy boolean)", () => {
  it("matches static screens exactly", () => {
    expect(
      matchHelpScreen("/finance/invoiceable", [
        "/finance/invoiceable",
        "/invoices/:id",
      ]),
    ).toBe(true);
  });

  it("matches billing-schemes leaf path for frecuencias-envio", () => {
    expect(
      matchHelpScreen("/settings/billing-schemes", [
        "/settings/billing-schemes",
      ]),
    ).toBe(true);
    expect(
      matchHelpScreen("/finance/dispatch/period", [
        "/settings/billing-schemes",
      ]),
    ).toBe(false);
  });

  it("matches :id patterns against UUID pathnames", () => {
    expect(
      matchHelpScreen("/invoices/a1b2c3d4-e5f6-7890-abcd-ef1234567890", [
        "/finance/invoiceable",
        "/invoices/:id",
      ]),
    ).toBe(true);
  });

  it("matches :id patterns against non-UUID segments", () => {
    expect(matchHelpScreen("/trips/TRP-001", ["/trips/:id"])).toBe(true);
  });

  it("does not match a different static route", () => {
    expect(
      matchHelpScreen("/finance/cobros", [
        "/finance/invoiceable",
        "/invoices/:id",
      ]),
    ).toBe(false);
  });

  it("does not match a longer path than the pattern", () => {
    expect(
      matchHelpScreen("/invoices/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit", [
        "/invoices/:id",
      ]),
    ).toBe(false);
  });

  it("ignores undeclared query keys on the runtime screen", () => {
    expect(
      matchHelpScreen("/invoices/abc-123?tab=pdf", ["/invoices/:id"]),
    ).toBe(true);
  });

  it("returns false for empty patterns", () => {
    expect(matchHelpScreen("/invoices/abc", [])).toBe(false);
  });
});

describe("scoreHelpScreen", () => {
  it("scores fixed segments higher than :param siblings", () => {
    expect(
      scoreHelpScreen("/finance/operator-payments/advances", [
        "/finance/operator-payments/advances",
      ]),
    ).toBe(300);
    expect(
      scoreHelpScreen("/finance/operator-payments/advances", [
        "/finance/operator-payments/:id",
      ]),
    ).toBe(201);
  });

  it("adds +10 per satisfied query pair; undeclared runtime keys ignored", () => {
    expect(
      scoreHelpScreen("/finance/analysis?view=margin&page=2", [
        "/finance/analysis?view=margin",
      ]),
    ).toBe(210);
    expect(
      scoreHelpScreen("/finance/analysis?view=margin", [
        "/finance/analysis",
      ]),
    ).toBe(200);
  });

  it("rejects pattern query when a declared pair is missing or differs", () => {
    expect(
      scoreHelpScreen("/finance/analysis", [
        "/finance/analysis?view=margin",
      ]),
    ).toBeNull();
    expect(
      scoreHelpScreen("/finance/analysis?view=expenses", [
        "/finance/analysis?view=margin",
      ]),
    ).toBeNull();
  });
});

describe("filterArticlesByMaxScreenScore — PRD §G + N1/N3/N4 + A5", () => {
  it.each([
    ["/finance/operator-payments/advances", ["registrar-anticipo-operador"]],
    ["/finance/operator-payments/operators", ["perfil-pago-operador"]],
    ["/finance/operator-payments/tariffs", ["esquema-compensacion"]],
    [
      `/finance/operator-payments/tariffs/${UUID}/build`,
      ["esquema-compensacion"],
    ],
    ["/finance/operator-payments", ["liquidar-viaje"]],
    ["/finance/operator-payments/new", ["liquidar-viaje"]],
    [`/finance/operator-payments/${UUID}`, ["liquidar-viaje"]],
    ["/vehicles/new", ["cargar-flota-clientes"]],
    ["/trailers/new", ["cargar-flota-clientes"]],
    ["/drivers/new", ["cargar-flota-clientes"]],
    [`/vehicles/${UUID}`, ["corregir-ficha-flota"]],
    [`/vehicles/${UUID}/edit`, ["corregir-ficha-flota"]],
    ["/clients/new", ["alta-cliente"]],
    [`/clients/${UUID}`, ["ficha-cliente"]],
    [`/clients/${UUID}/edit`, ["ficha-cliente"]],
    ["/users/new", ["alta-usuarios-rol"]],
    ["/users/activity", ["revisar-historial-usuarios"]],
    ["/users", ["usuarios-configuracion"]],
    [`/users/${UUID}`, ["usuarios-configuracion"]],
    ["/branches/new", ["abrir-sucursal"]],
    [`/branches/${UUID}/edit`, ["abrir-sucursal"]],
    ["/branches", ["consultar-sucursales"]],
    [`/branches/${UUID}`, ["consultar-sucursales"]],
    ["/finance/analysis", ["consultar-tendencia"]],
    ["/finance/analysis?view=performance", ["consultar-tendencia"]],
    ["/finance/analysis?view=yoy", ["consultar-tendencia"]],
    ["/finance/analysis?view=margin", ["ver-rentabilidad"]],
    ["/finance/analysis?view=expenses", ["revisar-gasto-viaje"]],
    ["/finance/analysis?view=margin&page=2", ["ver-rentabilidad"]],
    ["/trips/new", ["reservar-viaje"]],
    ["/finance/dispatch/period", ["despachar-facturas"]],
    [`/finance/operator-payments/cuts`, ["liquidar-viaje"]],
  ] as const)("%s → %j", (screen, expectedIds) => {
    expect(winners(screen)).toEqual([...expectedIds]);
  });

  it("R-LIST: ficha / liquidar / sibling analysis stay out of the max set", () => {
    expect(winners("/vehicles/new")).not.toContain("corregir-ficha-flota");
    expect(winners("/finance/operator-payments/advances")).not.toContain(
      "liquidar-viaje",
    );
    expect(winners("/finance/analysis?view=margin")).toEqual([
      "ver-rentabilidad",
    ]);
    expect(winners("/trips/new")).not.toContain("seguir-viaje");
    expect(winners("/trips/new")).not.toContain("confirmar-reserva");
  });

  it("UUID detail still opens the ficha/detail article (§H.9)", () => {
    expect(winners(`/vehicles/${UUID}`)).toEqual(["corregir-ficha-flota"]);
    expect(winners(`/clients/${UUID}`)).toEqual(["ficha-cliente"]);
    expect(winners(`/trips/${UUID}`)).toEqual(
      expect.arrayContaining(["seguir-viaje", "confirmar-reserva"]),
    );
  });
});
