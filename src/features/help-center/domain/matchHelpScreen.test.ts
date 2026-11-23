/**
 * Parity twin: boeltech-transport-api/src/modules/help-center/domain/matchHelpScreen.ts
 *
 * Mirror cases: PRD §G + N1, N3, N4 + A5 (R-SPEC / R-VIEW / R-LIST)
 * + plan-tec-corte-b §H.1 / §H.2 (TB-5..8 / TB-7).
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
const TRIP = `/trips/${UUID}`;

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
  // Corte B — viajes status/tab (sort_order equalized = 50)
  {
    id: "confirmar-reserva",
    screens: [
      "/trips/:id?status=draft",
      "/trips/:id?status=draft&tab=route",
      "/trips/:id?status=draft&tab=cargo",
      "/trips/:id?status=draft&tab=overview",
      "/trips/:id?status=draft&tab=tracking",
    ],
    sortOrder: 50,
  },
  {
    id: "seguir-viaje",
    screens: [
      "/trips",
      "/trips/:id?status=scheduled",
      "/trips/:id?status=in_progress",
      "/trips/:id?status=scheduled&tab=tracking",
      "/trips/:id?status=scheduled&tab=overview",
      "/trips/:id?status=scheduled&tab=route",
      "/trips/:id?status=scheduled&tab=cargo",
      "/trips/:id?status=in_progress&tab=tracking",
    ],
    sortOrder: 50,
  },
  {
    id: "ajustar-viaje-en-ruta",
    screens: [
      "/trips/:id?status=in_progress&tab=route",
      "/trips/:id?status=in_progress&tab=cargo",
      "/trips/:id?status=in_progress&tab=overview",
    ],
    sortOrder: 50,
  },
  {
    id: "registrar-gasto-viaje",
    screens: ["/trips/:id?tab=costs"],
    sortOrder: 50,
  },
  {
    id: "corregir-anular-cfdi",
    screens: [
      "/trips/:id?tab=billing",
      "/trips/:id?status=cancelled",
      "/invoices/:id",
    ],
    sortOrder: 50,
  },
  {
    id: "generar-orden-viaje",
    screens: ["/trips/:id?status=completed", "/trips/:id"],
    sortOrder: 50,
  },
  {
    id: "datos-carta-porte-viaje",
    screens: ["/trips/:id"],
    sortOrder: 50,
  },
  {
    id: "planear-retorno-viaje",
    screens: [],
    sortOrder: 50,
  },
  {
    id: "despachar-facturas",
    screens: ["/finance/dispatch/period", "/finance/dispatch/:id"],
    sortOrder: 100,
  },
  // Facturas / cobranza (TB-1 · TB-4) — sort equalized for CB-I9
  {
    id: "enviar-factura",
    screens: ["/finance/invoices", "/invoices/:id", "/finance/dispatch"],
    sortOrder: 90,
  },
  {
    id: "cobrar-a-credito",
    screens: ["/finance/payments", "/finance/invoices", "/invoices/:id"],
    sortOrder: 90,
  },
  // Portales — pool aparte en CB-I8 (roles = composición del pool)
  {
    id: "portal-cliente",
    screens: [
      "/dashboard",
      "/trips",
      "/trips/:id",
      "/finance/invoices",
      "/invoices/:id",
    ],
    sortOrder: 50,
  },
  {
    id: "portal-conductor",
    screens: ["/dashboard", "/trips", "/trips/:id"],
    sortOrder: 50,
  },
];

function winners(screen: string, pool: readonly Fixture[] = ARTICLES): string[] {
  return filterArticlesByMaxScreenScore(screen, pool).map((a) => a.id);
}

function tripOpsPool(): Fixture[] {
  return ARTICLES.filter((a) =>
    [
      "confirmar-reserva",
      "seguir-viaje",
      "ajustar-viaje-en-ruta",
      "registrar-gasto-viaje",
      "corregir-anular-cfdi",
      "generar-orden-viaje",
      "datos-carta-porte-viaje",
      "planear-retorno-viaje",
      "reservar-viaje",
    ].includes(a.id),
  );
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

  it("UUID detail bare → respaldo orden/CP (TB-7), no operativos", () => {
    const ids = winners(TRIP, tripOpsPool());
    expect(ids).toEqual(
      expect.arrayContaining([
        "generar-orden-viaje",
        "datos-carta-porte-viaje",
      ]),
    );
    expect(ids).not.toContain("seguir-viaje");
    expect(ids).not.toContain("confirmar-reserva");
    expect(ids).not.toContain("ajustar-viaje-en-ruta");
  });
});

describe("filterArticlesByMaxScreenScore — corte B §H.1 (TB-7)", () => {
  const pool = tripOpsPool();

  it("CB-I1: ?tab=costs → registrar-gasto-viaje", () => {
    expect(winners(`${TRIP}?tab=costs`, pool)).toEqual([
      "registrar-gasto-viaje",
    ]);
  });

  it("CB-I2: ?tab=billing → corregir-anular-cfdi", () => {
    expect(winners(`${TRIP}?tab=billing`, pool)).toEqual([
      "corregir-anular-cfdi",
    ]);
  });

  it("CB-I3: ?tab=tracking sin status → respaldo bare (no seguir)", () => {
    const ids = winners(`${TRIP}?tab=tracking`, pool);
    expect(ids).toEqual(
      expect.arrayContaining([
        "generar-orden-viaje",
        "datos-carta-porte-viaje",
      ]),
    );
    expect(ids).not.toContain("seguir-viaje");
  });

  it("CB-I4: ?status=draft → solo confirmar-reserva", () => {
    expect(winners(`${TRIP}?status=draft`, pool)).toEqual([
      "confirmar-reserva",
    ]);
  });

  it.each([
    ["CB-I5a", `${TRIP}?status=scheduled`],
    ["CB-I5b", `${TRIP}?status=in_progress`],
  ] as const)("%s → solo seguir-viaje", (_id, screen) => {
    expect(winners(screen, pool)).toEqual(["seguir-viaje"]);
  });

  it.each([
    ["CB-I5c", `${TRIP}?status=scheduled&tab=tracking`],
    ["CB-I5d", `${TRIP}?status=in_progress&tab=tracking`],
  ] as const)("%s → solo seguir-viaje", (_id, screen) => {
    expect(winners(screen, pool)).toEqual(["seguir-viaje"]);
  });

  it.each([
    ["CB-I6a", `${TRIP}?status=in_progress&tab=route`],
    ["CB-I6b", `${TRIP}?status=in_progress&tab=cargo`],
    ["CB-I6c", `${TRIP}?status=in_progress&tab=overview`],
  ] as const)("%s → solo ajustar-viaje-en-ruta", (_id, screen) => {
    expect(winners(screen, pool)).toEqual(["ajustar-viaje-en-ruta"]);
  });

  it("CB-I7a: ?status=completed → generar-orden-viaje (sin operativos/retorno)", () => {
    const ids = winners(`${TRIP}?status=completed`, pool);
    expect(ids).toEqual(["generar-orden-viaje"]);
    expect(ids).not.toContain("seguir-viaje");
    expect(ids).not.toContain("confirmar-reserva");
    expect(ids).not.toContain("ajustar-viaje-en-ruta");
    expect(ids).not.toContain("planear-retorno-viaje");
  });

  it("CB-I7b: ?status=cancelled → corregir-anular-cfdi", () => {
    const ids = winners(`${TRIP}?status=cancelled`, pool);
    expect(ids).toEqual(["corregir-anular-cfdi"]);
    expect(ids).not.toContain("seguir-viaje");
    expect(ids).not.toContain("planear-retorno-viaje");
  });

  it("CB-I8: portal pool → portal-* (roles = composición del pool)", () => {
    const portals = ARTICLES.filter((a) => a.id.startsWith("portal-"));
    expect(winners("/dashboard", portals)).toEqual(
      expect.arrayContaining(["portal-cliente", "portal-conductor"]),
    );
    expect(winners(TRIP, portals)).toEqual(
      expect.arrayContaining(["portal-cliente", "portal-conductor"]),
    );
  });

  it("CB-I9: /finance/invoices → enviar+cobrar empatan path (sort = caller)", () => {
    const finance = ARTICLES.filter((a) =>
      ["enviar-factura", "cobrar-a-credito"].includes(a.id),
    );
    expect(winners("/finance/invoices", finance).sort()).toEqual([
      "cobrar-a-credito",
      "enviar-factura",
    ]);
  });

  it("CB-I10: /finance/payments → cobrar-a-credito", () => {
    const finance = ARTICLES.filter((a) =>
      ["enviar-factura", "cobrar-a-credito"].includes(a.id),
    );
    expect(winners("/finance/payments", finance)).toEqual([
      "cobrar-a-credito",
    ]);
  });

  it("CB-I11: Análisis view /trips/new — regresión corte A", () => {
    expect(winners("/finance/analysis?view=margin")).toEqual([
      "ver-rentabilidad",
    ]);
    expect(winners("/trips/new")).toEqual(["reservar-viaje"]);
  });
});

describe("filterArticlesByMaxScreenScore — corte B §H.2 empates", () => {
  const pool = tripOpsPool();

  it("CB-TIE-1: inyector quita status → ?tab=costs → gasto", () => {
    expect(winners(`${TRIP}?tab=costs`, pool)).toEqual([
      "registrar-gasto-viaje",
    ]);
  });

  it("CB-TIE-2: ?status=draft&tab=tracking → confirmar (121)", () => {
    expect(
      scoreHelpScreen(`${TRIP}?status=draft&tab=tracking`, [
        "/trips/:id?status=draft&tab=tracking",
      ]),
    ).toBe(121);
    expect(winners(`${TRIP}?status=draft&tab=tracking`, pool)).toEqual([
      "confirmar-reserva",
    ]);
  });

  it("CB-TIE-3: ?tab=tracking sin status → respaldo bare", () => {
    const ids = winners(`${TRIP}?tab=tracking`, pool);
    expect(ids).not.toContain("seguir-viaje");
    expect(ids).toEqual(
      expect.arrayContaining([
        "generar-orden-viaje",
        "datos-carta-porte-viaje",
      ]),
    );
  });

  it("CB-TIE-4: ?status=completed — operativos sin bare no entran", () => {
    expect(winners(`${TRIP}?status=completed`, pool)).toEqual([
      "generar-orden-viaje",
    ]);
  });

  it("CB-TIE-5: cancelled + planear-retorno en pool → retorno no max", () => {
    const ids = winners(`${TRIP}?status=cancelled`, pool);
    expect(ids).toEqual(["corregir-anular-cfdi"]);
    expect(ids).not.toContain("planear-retorno-viaje");
  });

  it("CB-TIE-6: draft+billing (solo tab tras inyector) → corregir", () => {
    expect(winners(`${TRIP}?tab=billing`, pool)).toEqual([
      "corregir-anular-cfdi",
    ]);
  });
});
