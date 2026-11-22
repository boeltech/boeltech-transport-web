import { describe, expect, it } from "vitest";
import type { HelpArticle } from "../domain";
import { filterArticlesByMaxScreenScore } from "../domain/matchHelpScreen";
import { selectPrimaryHelpArticle } from "./selectPrimaryHelpArticle";

function article(
  partial: Pick<HelpArticle, "id" | "sortOrder"> &
    Partial<Omit<HelpArticle, "id" | "sortOrder">>,
): HelpArticle {
  return {
    title: partial.title ?? partial.id,
    group: partial.group ?? "viajes",
    screens: partial.screens ?? [],
    roles: partial.roles ?? [],
    phrase: partial.phrase ?? `phrase-${partial.id}`,
    guide: partial.guide ?? null,
    problem: partial.problem ?? null,
    ...partial,
  };
}

/** U07 post-D2: hermanas con sort < 130 para que :id de liquidar no gane el `?`. */
const U07_ARTICLES: HelpArticle[] = [
  article({
    id: "liquidar-viaje",
    sortOrder: 130,
    group: "pagos_operadores",
    screens: [
      "/finance/operator-payments",
      "/finance/operator-payments/new",
      "/finance/operator-payments/:id",
    ],
  }),
  article({
    id: "registrar-anticipo-operador",
    sortOrder: 125,
    group: "pagos_operadores",
    screens: ["/finance/operator-payments/advances"],
  }),
  article({
    id: "perfil-pago-operador",
    sortOrder: 126,
    group: "pagos_operadores",
    screens: ["/finance/operator-payments/operators"],
  }),
  article({
    id: "esquema-compensacion",
    sortOrder: 127,
    group: "pagos_operadores",
    screens: [
      "/finance/operator-payments/tariffs",
      "/finance/operator-payments/tariffs/:id/build",
    ],
  }),
];

/** U03 Flota + U04 Comercial: primario por ruta (ola 5 D; C4 hallazgos-u03-u04). */
const U03_U04_ARTICLES: HelpArticle[] = [
  article({
    id: "cargar-flota-clientes",
    sortOrder: 30,
    group: "flota",
    screens: [
      "/vehicles",
      "/vehicles/new",
      "/trailers",
      "/trailers/new",
      "/drivers",
      "/drivers/new",
    ],
  }),
  article({
    id: "documentos-por-vencer",
    sortOrder: 35,
    group: "flota",
    screens: ["/fleet/documents"],
  }),
  article({
    id: "corregir-ficha-flota",
    sortOrder: 45,
    group: "flota",
    screens: [
      "/vehicles/:id",
      "/vehicles/:id/edit",
      "/trailers/:id",
      "/trailers/:id/edit",
      "/drivers/:id",
      "/drivers/:id/edit",
    ],
  }),
  article({
    id: "alta-cliente",
    sortOrder: 70,
    group: "comercial",
    screens: ["/clients", "/clients/new"],
  }),
  article({
    id: "ficha-cliente",
    sortOrder: 75,
    group: "comercial",
    screens: ["/clients/:id", "/clients/:id/edit"],
  }),
  article({
    id: "efectivo-sin-factura",
    sortOrder: 105,
    group: "cobranza",
    screens: [
      "/finance/operational-cash-pending",
      "/clients/:id/operational-receipt-batches/new",
    ],
  }),
];

/** U09 Administración: primario por ruta (ola 6 D-A; activity/new ante :id). */
const U09_ARTICLES: HelpArticle[] = [
  article({
    id: "abrir-sucursal",
    sortOrder: 15,
    group: "administracion",
    screens: ["/branches/new", "/branches/:id/edit"],
  }),
  article({
    id: "revisar-historial-usuarios",
    sortOrder: 18,
    group: "administracion",
    screens: ["/users/activity"],
  }),
  article({
    id: "alta-usuarios-rol",
    sortOrder: 20,
    group: "administracion",
    screens: ["/users/new"],
  }),
  article({
    id: "registrar-empleado",
    sortOrder: 40,
    group: "administracion",
    screens: ["/employees", "/employees/new", "/employees/:id"],
  }),
  article({
    id: "consultar-sucursales",
    sortOrder: 60,
    group: "administracion",
    screens: ["/branches", "/branches/:id"],
  }),
  article({
    id: "usuarios-configuracion",
    sortOrder: 190,
    group: "administracion",
    screens: ["/users", "/users/:id"],
  }),
];

/** U01 Inicio + U10 Mi cuenta: primario por ruta×rol (ola 7 D-A). */
const U01_U10_ARTICLES: HelpArticle[] = [
  article({
    id: "comparar-sucursales",
    sortOrder: 25,
    group: "operacion",
    roles: ["admin", "manager"],
    screens: ["/dashboard"],
  }),
  article({
    id: "cuenta-seguridad",
    sortOrder: 8,
    group: "tu_cuenta",
    roles: [
      "admin",
      "manager",
      "dispatcher",
      "accountant",
      "operator",
      "driver",
      "client",
    ],
    screens: ["/account", "/account/security"],
  }),
];

/** U10 Monitoreo: primario por ruta×rol (ola 7 D-B). */
const U10_MONITOREO_ARTICLES: HelpArticle[] = [
  article({
    id: "ver-flota-mapa",
    sortOrder: 36,
    group: "monitoreo",
    roles: ["admin", "manager", "dispatcher"],
    screens: [
      "/monitoring/fleet",
      "/monitoring/fleet/history/:vehicleId",
    ],
  }),
  article({
    id: "revisar-alertas-gps",
    sortOrder: 37,
    group: "monitoreo",
    roles: ["admin", "manager", "dispatcher"],
    screens: ["/monitoring/alerts"],
  }),
  article({
    id: "ajustar-alertas-gps",
    sortOrder: 38,
    group: "monitoreo",
    roles: ["admin"],
    screens: ["/monitoring/settings"],
  }),
];

/** U11 Portales: primario por ruta×rol (ola 7 D-C; H-U11-N01 `/trips/:id` client). */
const U11_PORTALES_ARTICLES: HelpArticle[] = [
  article({
    id: "portal-cliente",
    sortOrder: 170,
    group: "portales",
    roles: ["client"],
    screens: [
      "/dashboard",
      "/trips",
      "/trips/:id",
      "/finance/invoices",
      "/invoices/:id",
    ],
  }),
  article({
    id: "portal-conductor",
    sortOrder: 180,
    group: "portales",
    roles: ["driver"],
    screens: ["/dashboard", "/trips", "/trips/:id"],
  }),
];

/** U02 Viajes: `reservar-viaje` (seed 201 / migr. 279; roles staff con reserva). */
const U02_RESERVAR_VIAJE: HelpArticle = article({
  id: "reservar-viaje",
  sortOrder: 40,
  group: "operacion",
  roles: ["admin", "manager", "dispatcher", "operator"],
  screens: ["/trips", "/trips/new"],
});

/**
 * C7 (TC7-3): catálogo mínimo ruta×rol para fijar huecos «sin artículo»
 * y positivos vecinos (dashboard / trips). Sin screens en notificaciones,
 * ayuda ni forbidden.
 */
const C7_COVERAGE_ARTICLES: HelpArticle[] = [
  ...U01_U10_ARTICLES,
  ...U11_PORTALES_ARTICLES,
  U02_RESERVAR_VIAJE,
];

const ALL_SEVEN_ROLES = [
  "admin",
  "manager",
  "dispatcher",
  "accountant",
  "operator",
  "driver",
  "client",
] as const;

/** U08 Finanzas: primario por ruta (ola 4 D; Tendencia 145 ante Margen 150). */
const U08_ARTICLES: HelpArticle[] = [
  article({
    id: "revisar-cartera",
    sortOrder: 110,
    group: "finanzas",
    screens: ["/finance"],
  }),
  article({
    id: "cobrar-a-credito",
    sortOrder: 100,
    group: "cobranza",
    screens: ["/finance/payments", "/finance/invoices", "/invoices/:id"],
  }),
  article({
    id: "aprobar-cola",
    sortOrder: 120,
    group: "finanzas",
    screens: ["/finance/approvals"],
  }),
  article({
    id: "consultar-tendencia",
    sortOrder: 145,
    group: "finanzas",
    screens: ["/finance/analysis", "/finance/analysis?view=performance"],
  }),
  article({
    id: "ver-rentabilidad",
    sortOrder: 150,
    group: "finanzas",
    screens: ["/finance/analysis?view=margin"],
  }),
  article({
    id: "revisar-gasto-viaje",
    sortOrder: 170,
    group: "finanzas",
    screens: ["/finance/analysis?view=expenses"],
  }),
  article({
    id: "consultar-reportes",
    sortOrder: 160,
    group: "finanzas",
    screens: ["/reports"],
  }),
];

/**
 * Simula API: filtro por max screen score, luego primario = min sortOrder.
 * `screen` puede incluir query (`pathname + search`).
 */
function primaryForPath(
  screen: string,
  catalog: readonly HelpArticle[] = U07_ARTICLES,
  role?: string,
): string | null {
  const roleFiltered =
    role == null
      ? catalog
      : catalog.filter((a) => {
          // Paridad API `roles && ARRAY[$1]::text[]`: roles vacío no hace match.
          return a.roles.includes(role);
        });
  const matched = filterArticlesByMaxScreenScore(screen, roleFiltered);
  return selectPrimaryHelpArticle(matched)?.id ?? null;
}

function listForScreen(
  screen: string,
  catalog: readonly HelpArticle[],
): string[] {
  return filterArticlesByMaxScreenScore(screen, catalog).map((a) => a.id);
}

describe("selectPrimaryHelpArticle", () => {
  it("returns null for empty/missing lists", () => {
    expect(selectPrimaryHelpArticle(undefined)).toBeNull();
    expect(selectPrimaryHelpArticle(null)).toBeNull();
    expect(selectPrimaryHelpArticle([])).toBeNull();
  });

  it("picks the lowest sortOrder (ASC)", () => {
    const primary = selectPrimaryHelpArticle([
      article({ id: "b", sortOrder: 20, phrase: "second" }),
      article({ id: "a", sortOrder: 10, phrase: "first" }),
      article({ id: "c", sortOrder: 30, phrase: "third" }),
    ]);
    expect(primary?.id).toBe("a");
    expect(primary?.phrase).toBe("first");
  });

  it("keeps first among equal sortOrder after stable sort by input order", () => {
    const primary = selectPrimaryHelpArticle([
      article({ id: "first", sortOrder: 1 }),
      article({ id: "second", sortOrder: 1 }),
    ]);
    expect(primary?.id).toBe("first");
  });

  describe("U07 operator-payments · D2 sort_order vs :id overlap", () => {
    it("Pagos lista y detalle UUID → liquidar-viaje", () => {
      expect(primaryForPath("/finance/operator-payments")).toBe(
        "liquidar-viaje",
      );
      expect(
        primaryForPath(
          "/finance/operator-payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        ),
      ).toBe("liquidar-viaje");
      expect(primaryForPath("/finance/operator-payments/new")).toBe(
        "liquidar-viaje",
      );
    });

    it("Anticipos / Operadores / Tarifas no ceden a liquidar-viaje", () => {
      expect(primaryForPath("/finance/operator-payments/advances")).toBe(
        "registrar-anticipo-operador",
      );
      expect(primaryForPath("/finance/operator-payments/operators")).toBe(
        "perfil-pago-operador",
      );
      expect(primaryForPath("/finance/operator-payments/tariffs")).toBe(
        "esquema-compensacion",
      );
      expect(
        primaryForPath(
          "/finance/operator-payments/tariffs/tpl-1/build",
        ),
      ).toBe("esquema-compensacion");
    });

    it("hermanas con sort ≥ 130 siguen ganando por especificidad (corte A)", () => {
      const equalizedOrHigher = U07_ARTICLES.map((a) => {
        if (a.id === "registrar-anticipo-operador")
          return { ...a, sortOrder: 135 };
        if (a.id === "perfil-pago-operador") return { ...a, sortOrder: 138 };
        if (a.id === "esquema-compensacion") return { ...a, sortOrder: 140 };
        return a;
      });
      expect(
        primaryForPath(
          "/finance/operator-payments/advances",
          equalizedOrHigher,
        ),
      ).toBe("registrar-anticipo-operador");
      expect(
        primaryForPath(
          "/finance/operator-payments/operators",
          equalizedOrHigher,
        ),
      ).toBe("perfil-pago-operador");
      expect(
        primaryForPath(
          "/finance/operator-payments/tariffs",
          equalizedOrHigher,
        ),
      ).toBe("esquema-compensacion");
    });
  });

  describe("U03/U04 fleet+clients · ola5 D primario por ruta", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    it("/vehicles · /vehicles/new → cargar-flota-clientes (30)", () => {
      expect(primaryForPath("/vehicles", U03_U04_ARTICLES)).toBe(
        "cargar-flota-clientes",
      );
      expect(primaryForPath("/vehicles/new", U03_U04_ARTICLES)).toBe(
        "cargar-flota-clientes",
      );
    });

    it("/vehicles/:uuid · edit → corregir-ficha-flota (45)", () => {
      expect(primaryForPath(`/vehicles/${uuid}`, U03_U04_ARTICLES)).toBe(
        "corregir-ficha-flota",
      );
      expect(
        primaryForPath(`/vehicles/${uuid}/edit`, U03_U04_ARTICLES),
      ).toBe("corregir-ficha-flota");
    });

    it("/trailers · /new → cargar-flota-clientes", () => {
      expect(primaryForPath("/trailers", U03_U04_ARTICLES)).toBe(
        "cargar-flota-clientes",
      );
      expect(primaryForPath("/trailers/new", U03_U04_ARTICLES)).toBe(
        "cargar-flota-clientes",
      );
    });

    it("/drivers · /new → cargar-flota-clientes", () => {
      expect(primaryForPath("/drivers", U03_U04_ARTICLES)).toBe(
        "cargar-flota-clientes",
      );
      expect(primaryForPath("/drivers/new", U03_U04_ARTICLES)).toBe(
        "cargar-flota-clientes",
      );
    });

    it("/drivers/:uuid → corregir-ficha-flota", () => {
      expect(primaryForPath(`/drivers/${uuid}`, U03_U04_ARTICLES)).toBe(
        "corregir-ficha-flota",
      );
    });

    it("/fleet/documents → documentos-por-vencer (35)", () => {
      expect(primaryForPath("/fleet/documents", U03_U04_ARTICLES)).toBe(
        "documentos-por-vencer",
      );
    });

    it("/clients · /new → alta-cliente (70)", () => {
      expect(primaryForPath("/clients", U03_U04_ARTICLES)).toBe("alta-cliente");
      expect(primaryForPath("/clients/new", U03_U04_ARTICLES)).toBe(
        "alta-cliente",
      );
    });

    it("/clients/:uuid → ficha-cliente (75)", () => {
      expect(primaryForPath(`/clients/${uuid}`, U03_U04_ARTICLES)).toBe(
        "ficha-cliente",
      );
    });

    it("/clients/:id/operational-receipt-batches/new → efectivo-sin-factura", () => {
      expect(
        primaryForPath(
          `/clients/${uuid}/operational-receipt-batches/new`,
          U03_U04_ARTICLES,
        ),
      ).toBe("efectivo-sin-factura");
      expect(
        primaryForPath("/finance/operational-cash-pending", U03_U04_ARTICLES),
      ).toBe("efectivo-sin-factura");
    });
  });

  describe("U09 admin · ola6 D-A primario por ruta", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    it("/users · /users/:uuid → usuarios-configuracion (190)", () => {
      expect(primaryForPath("/users", U09_ARTICLES)).toBe(
        "usuarios-configuracion",
      );
      expect(primaryForPath(`/users/${uuid}`, U09_ARTICLES)).toBe(
        "usuarios-configuracion",
      );
    });

    it("/users/new → alta-usuarios-rol (20)", () => {
      expect(primaryForPath("/users/new", U09_ARTICLES)).toBe(
        "alta-usuarios-rol",
      );
    });

    it("/users/activity → revisar-historial-usuarios (18)", () => {
      expect(primaryForPath("/users/activity", U09_ARTICLES)).toBe(
        "revisar-historial-usuarios",
      );
    });

    it("/branches · /branches/:uuid → consultar-sucursales (60)", () => {
      expect(primaryForPath("/branches", U09_ARTICLES)).toBe(
        "consultar-sucursales",
      );
      expect(primaryForPath(`/branches/${uuid}`, U09_ARTICLES)).toBe(
        "consultar-sucursales",
      );
    });

    it("/branches/new · /branches/:uuid/edit → abrir-sucursal (15)", () => {
      expect(primaryForPath("/branches/new", U09_ARTICLES)).toBe(
        "abrir-sucursal",
      );
      expect(primaryForPath(`/branches/${uuid}/edit`, U09_ARTICLES)).toBe(
        "abrir-sucursal",
      );
    });

    it("/employees · /new · /:uuid → registrar-empleado (40)", () => {
      expect(primaryForPath("/employees", U09_ARTICLES)).toBe(
        "registrar-empleado",
      );
      expect(primaryForPath("/employees/new", U09_ARTICLES)).toBe(
        "registrar-empleado",
      );
      expect(primaryForPath(`/employees/${uuid}`, U09_ARTICLES)).toBe(
        "registrar-empleado",
      );
    });
  });

  describe("U01/U10 inicio+cuenta · ola7 D-A primario por ruta×rol", () => {
    const staffWithAccount = [
      "admin",
      "manager",
      "dispatcher",
      "accountant",
      "operator",
    ] as const;

    it("/dashboard × admin|manager → comparar-sucursales", () => {
      expect(
        primaryForPath("/dashboard", U01_U10_ARTICLES, "admin"),
      ).toBe("comparar-sucursales");
      expect(
        primaryForPath("/dashboard", U01_U10_ARTICLES, "manager"),
      ).toBe("comparar-sucursales");
    });

    it("/dashboard × dispatcher|accountant|operator → null (sin art)", () => {
      expect(
        primaryForPath("/dashboard", U01_U10_ARTICLES, "dispatcher"),
      ).toBeNull();
      expect(
        primaryForPath("/dashboard", U01_U10_ARTICLES, "accountant"),
      ).toBeNull();
      expect(
        primaryForPath("/dashboard", U01_U10_ARTICLES, "operator"),
      ).toBeNull();
    });

    it("/account · /account/security × roles con cuenta → cuenta-seguridad", () => {
      for (const role of staffWithAccount) {
        expect(primaryForPath("/account", U01_U10_ARTICLES, role)).toBe(
          "cuenta-seguridad",
        );
        expect(
          primaryForPath("/account/security", U01_U10_ARTICLES, role),
        ).toBe("cuenta-seguridad");
      }
      expect(primaryForPath("/account", U01_U10_ARTICLES, "driver")).toBe(
        "cuenta-seguridad",
      );
      expect(
        primaryForPath("/account/security", U01_U10_ARTICLES, "client"),
      ).toBe("cuenta-seguridad");
    });
  });

  describe("U10 monitoreo · ola7 D-B primario por ruta×rol", () => {
    const gpsStaff = ["admin", "manager", "dispatcher"] as const;
    const noGpsRoles = [
      "accountant",
      "operator",
      "client",
      "driver",
    ] as const;
    const vehicleId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    it("/monitoring/fleet · history × admin|manager|dispatcher → ver-flota-mapa", () => {
      for (const role of gpsStaff) {
        expect(
          primaryForPath("/monitoring/fleet", U10_MONITOREO_ARTICLES, role),
        ).toBe("ver-flota-mapa");
        expect(
          primaryForPath(
            `/monitoring/fleet/history/${vehicleId}`,
            U10_MONITOREO_ARTICLES,
            role,
          ),
        ).toBe("ver-flota-mapa");
      }
    });

    it("/monitoring/alerts × admin|manager|dispatcher → revisar-alertas-gps", () => {
      for (const role of gpsStaff) {
        expect(
          primaryForPath("/monitoring/alerts", U10_MONITOREO_ARTICLES, role),
        ).toBe("revisar-alertas-gps");
      }
    });

    it("/monitoring/settings × admin → ajustar-alertas-gps", () => {
      expect(
        primaryForPath("/monitoring/settings", U10_MONITOREO_ARTICLES, "admin"),
      ).toBe("ajustar-alertas-gps");
    });

    it("/monitoring/settings × manager|dispatcher → null", () => {
      expect(
        primaryForPath(
          "/monitoring/settings",
          U10_MONITOREO_ARTICLES,
          "manager",
        ),
      ).toBeNull();
      expect(
        primaryForPath(
          "/monitoring/settings",
          U10_MONITOREO_ARTICLES,
          "dispatcher",
        ),
      ).toBeNull();
    });

    it("rutas monitoreo × roles sin gps / client|driver → null", () => {
      const paths = [
        "/monitoring/fleet",
        `/monitoring/fleet/history/${vehicleId}`,
        "/monitoring/alerts",
        "/monitoring/settings",
      ];
      for (const role of noGpsRoles) {
        for (const path of paths) {
          expect(
            primaryForPath(path, U10_MONITOREO_ARTICLES, role),
          ).toBeNull();
        }
      }
    });
  });

  describe("U11 portales · ola7 D-C primario por ruta×rol", () => {
    const tripId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const invoiceId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

    it("client · /dashboard · /trips · /trips/:id → portal-cliente (H-U11-N01)", () => {
      expect(
        primaryForPath("/dashboard", U11_PORTALES_ARTICLES, "client"),
      ).toBe("portal-cliente");
      expect(primaryForPath("/trips", U11_PORTALES_ARTICLES, "client")).toBe(
        "portal-cliente",
      );
      expect(
        primaryForPath(`/trips/${tripId}`, U11_PORTALES_ARTICLES, "client"),
      ).toBe("portal-cliente");
    });

    it("client · /finance/invoices · /invoices/:id → portal-cliente", () => {
      expect(
        primaryForPath("/finance/invoices", U11_PORTALES_ARTICLES, "client"),
      ).toBe("portal-cliente");
      expect(
        primaryForPath(
          `/invoices/${invoiceId}`,
          U11_PORTALES_ARTICLES,
          "client",
        ),
      ).toBe("portal-cliente");
    });

    it("driver · /dashboard · /trips · /trips/:id → portal-conductor", () => {
      expect(
        primaryForPath("/dashboard", U11_PORTALES_ARTICLES, "driver"),
      ).toBe("portal-conductor");
      expect(primaryForPath("/trips", U11_PORTALES_ARTICLES, "driver")).toBe(
        "portal-conductor",
      );
      expect(
        primaryForPath(`/trips/${tripId}`, U11_PORTALES_ARTICLES, "driver"),
      ).toBe("portal-conductor");
    });

    it("driver · facturas → null; staff × rutas portal → null", () => {
      expect(
        primaryForPath("/finance/invoices", U11_PORTALES_ARTICLES, "driver"),
      ).toBeNull();
      for (const role of ["admin", "manager", "dispatcher"] as const) {
        expect(
          primaryForPath("/dashboard", U11_PORTALES_ARTICLES, role),
        ).toBeNull();
        expect(
          primaryForPath(`/trips/${tripId}`, U11_PORTALES_ARTICLES, role),
        ).toBeNull();
      }
    });
  });

  /**
   * C7 / TC7-3: fijar «sin artículo» en rutas×roles sin guía (triage CEO).
   * Catálogo C7_COVERAGE_ARTICLES = inicio + portales + reservar-viaje.
   */
  describe("C7 cobertura · sin artículo (TC7-3) + positivos vecinos", () => {
    const helpArticleId = "comparar-sucursales";
    const ticketId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    it("/dashboard × admin|manager → comparar-sucursales", () => {
      expect(
        primaryForPath("/dashboard", C7_COVERAGE_ARTICLES, "admin"),
      ).toBe("comparar-sucursales");
      expect(
        primaryForPath("/dashboard", C7_COVERAGE_ARTICLES, "manager"),
      ).toBe("comparar-sucursales");
    });

    it("/dashboard × driver|client → portales", () => {
      expect(
        primaryForPath("/dashboard", C7_COVERAGE_ARTICLES, "driver"),
      ).toBe("portal-conductor");
      expect(
        primaryForPath("/dashboard", C7_COVERAGE_ARTICLES, "client"),
      ).toBe("portal-cliente");
    });

    it("/dashboard × dispatcher|accountant|operator → null", () => {
      for (const role of ["dispatcher", "accountant", "operator"] as const) {
        expect(
          primaryForPath("/dashboard", C7_COVERAGE_ARTICLES, role),
        ).toBeNull();
      }
    });

    it("/trips × admin|manager|dispatcher|operator → reservar-viaje", () => {
      for (const role of [
        "admin",
        "manager",
        "dispatcher",
        "operator",
      ] as const) {
        expect(primaryForPath("/trips", C7_COVERAGE_ARTICLES, role)).toBe(
          "reservar-viaje",
        );
      }
    });

    it("/trips × accountant → null", () => {
      expect(
        primaryForPath("/trips", C7_COVERAGE_ARTICLES, "accountant"),
      ).toBeNull();
    });

    it("/notifications × 7 roles → null", () => {
      for (const role of ALL_SEVEN_ROLES) {
        expect(
          primaryForPath("/notifications", C7_COVERAGE_ARTICLES, role),
        ).toBeNull();
      }
    });

    it("/ayuda · /ayuda/:id · tickets × 7 roles → null", () => {
      const paths = [
        "/ayuda",
        `/ayuda/${helpArticleId}`,
        "/ayuda/tickets",
        `/ayuda/tickets/${ticketId}`,
      ];
      for (const role of ALL_SEVEN_ROLES) {
        for (const path of paths) {
          expect(
            primaryForPath(path, C7_COVERAGE_ARTICLES, role),
          ).toBeNull();
        }
      }
    });

    it("/forbidden × 7 roles → null", () => {
      for (const role of ALL_SEVEN_ROLES) {
        expect(
          primaryForPath("/forbidden", C7_COVERAGE_ARTICLES, role),
        ).toBeNull();
      }
    });
  });

  describe("U08 finance · ola4 D primario por ruta", () => {
    it("/finance → revisar-cartera (sin ceder a cobrar-a-credito)", () => {
      expect(primaryForPath("/finance", U08_ARTICLES)).toBe("revisar-cartera");
    });

    it("/finance/payments → cobrar-a-credito", () => {
      expect(primaryForPath("/finance/payments", U08_ARTICLES)).toBe(
        "cobrar-a-credito",
      );
    });

    it("/finance/analysis → consultar-tendencia (sort 145)", () => {
      expect(primaryForPath("/finance/analysis", U08_ARTICLES)).toBe(
        "consultar-tendencia",
      );
    });

    it("/finance/approvals → aprobar-cola", () => {
      expect(primaryForPath("/finance/approvals", U08_ARTICLES)).toBe(
        "aprobar-cola",
      );
    });

    it("/reports → consultar-reportes", () => {
      expect(primaryForPath("/reports", U08_ARTICLES)).toBe(
        "consultar-reportes",
      );
    });
  });

  /**
   * PRD corte A §H.1–§H.10 — sort_order igualados; filtro max score + selectPrimary.
   * Paridad de match: mirror en domain/matchHelpScreen.test.ts (§H.10).
   */
  describe("corte A · §H.1–§H.10 sort igualados (R-SPEC / R-VIEW / R-LIST)", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    const H_U07: HelpArticle[] = U07_ARTICLES.map((a) => ({
      ...a,
      sortOrder: 130,
    }));

    const H_U03_U04: HelpArticle[] = U03_U04_ARTICLES.map((a) => {
      if (
        a.id === "cargar-flota-clientes" ||
        a.id === "corregir-ficha-flota"
      ) {
        return { ...a, sortOrder: 45 };
      }
      if (a.id === "alta-cliente" || a.id === "ficha-cliente") {
        return { ...a, sortOrder: 70 };
      }
      return a;
    });

    const H_U09: HelpArticle[] = U09_ARTICLES.map((a) => {
      if (
        a.id === "abrir-sucursal" ||
        a.id === "consultar-sucursales" ||
        a.id === "alta-usuarios-rol" ||
        a.id === "revisar-historial-usuarios" ||
        a.id === "usuarios-configuracion"
      ) {
        return { ...a, sortOrder: 60 };
      }
      return a;
    });

    const H_U08: HelpArticle[] = U08_ARTICLES.map((a) => {
      if (
        a.id === "consultar-tendencia" ||
        a.id === "ver-rentabilidad" ||
        a.id === "revisar-gasto-viaje"
      ) {
        return { ...a, sortOrder: 145 };
      }
      return a;
    });

    const H_N1: HelpArticle[] = [
      article({
        id: "reservar-viaje",
        sortOrder: 50,
        group: "operacion",
        screens: ["/trips", "/trips/new"],
      }),
      article({
        id: "seguir-viaje",
        sortOrder: 50,
        group: "operacion",
        screens: ["/trips/:id"],
      }),
      article({
        id: "confirmar-reserva",
        sortOrder: 50,
        group: "operacion",
        screens: ["/trips/:id"],
      }),
    ];

    it("§H.1 A1: advances/operators/tariffs no ceden a liquidar con sort igualado", () => {
      expect(primaryForPath("/finance/operator-payments/advances", H_U07)).toBe(
        "registrar-anticipo-operador",
      );
      expect(
        primaryForPath("/finance/operator-payments/operators", H_U07),
      ).toBe("perfil-pago-operador");
      expect(primaryForPath("/finance/operator-payments/tariffs", H_U07)).toBe(
        "esquema-compensacion",
      );
    });

    it("§H.2 A2: /vehicles/new vs UUID con sort 45 igualado", () => {
      expect(primaryForPath("/vehicles/new", H_U03_U04)).toBe(
        "cargar-flota-clientes",
      );
      expect(primaryForPath(`/vehicles/${uuid}`, H_U03_U04)).toBe(
        "corregir-ficha-flota",
      );
    });

    it("§H.3 A3: /clients/new vs UUID con sort 70 igualado", () => {
      expect(primaryForPath("/clients/new", H_U03_U04)).toBe("alta-cliente");
      expect(primaryForPath(`/clients/${uuid}`, H_U03_U04)).toBe(
        "ficha-cliente",
      );
    });

    it("§H.4 A4: users/new · activity · branches/new con sort igualado", () => {
      expect(primaryForPath("/users/new", H_U09)).toBe("alta-usuarios-rol");
      expect(primaryForPath("/users/activity", H_U09)).toBe(
        "revisar-historial-usuarios",
      );
      expect(primaryForPath("/branches/new", H_U09)).toBe("abrir-sucursal");
    });

    it("§H.5 A5: Análisis por view con sort 145 igualado", () => {
      expect(primaryForPath("/finance/analysis", H_U08)).toBe(
        "consultar-tendencia",
      );
      expect(
        primaryForPath("/finance/analysis?view=performance", H_U08),
      ).toBe("consultar-tendencia");
      expect(primaryForPath("/finance/analysis?view=yoy", H_U08)).toBe(
        "consultar-tendencia",
      );
      expect(primaryForPath("/finance/analysis?view=margin", H_U08)).toBe(
        "ver-rentabilidad",
      );
      expect(primaryForPath("/finance/analysis?view=expenses", H_U08)).toBe(
        "revisar-gasto-viaje",
      );
    });

    it("§H.6 N1: /trips/new → solo reservar-viaje en lista filtrada", () => {
      expect(primaryForPath("/trips/new", H_N1)).toBe("reservar-viaje");
      expect(listForScreen("/trips/new", H_N1)).toEqual(["reservar-viaje"]);
    });

    it("§H.7 R-LIST: ficha / liquidar / siblings analysis fuera de la lista", () => {
      expect(listForScreen("/vehicles/new", H_U03_U04)).not.toContain(
        "corregir-ficha-flota",
      );
      expect(
        listForScreen("/finance/operator-payments/advances", H_U07),
      ).not.toContain("liquidar-viaje");
      expect(listForScreen("/finance/analysis?view=margin", H_U08)).toEqual([
        "ver-rentabilidad",
      ]);
    });

    it("§H.8 R-ROLE: A1–A5 invariantes; portal/roles vacíos siguen null", () => {
      expect(
        primaryForPath(
          "/finance/operator-payments/advances",
          H_U07,
          "admin",
        ),
      ).toBeNull();
      const withRoles = H_U07.map((a) => ({
        ...a,
        roles: ["admin", "manager", "accountant"],
      }));
      expect(
        primaryForPath(
          "/finance/operator-payments/advances",
          withRoles,
          "admin",
        ),
      ).toBe("registrar-anticipo-operador");
      expect(
        primaryForPath(
          "/finance/operator-payments/advances",
          withRoles,
          "driver",
        ),
      ).toBeNull();
    });

    it("§H.9 UUID detalle abre ficha (no /new)", () => {
      expect(primaryForPath(`/vehicles/${uuid}`, H_U03_U04)).toBe(
        "corregir-ficha-flota",
      );
      expect(primaryForPath(`/clients/${uuid}`, H_U03_U04)).toBe(
        "ficha-cliente",
      );
      expect(primaryForPath(`/users/${uuid}`, H_U09)).toBe(
        "usuarios-configuracion",
      );
      expect(primaryForPath(`/branches/${uuid}`, H_U09)).toBe(
        "consultar-sucursales",
      );
    });

    it("§H.10 paridad: mismos winners que mirror matchHelpScreen §G", () => {
      // Covered by domain/matchHelpScreen.test.ts table; smoke a subset here.
      expect(listForScreen("/finance/analysis?view=margin", H_U08)).toEqual([
        "ver-rentabilidad",
      ]);
      expect(listForScreen("/trips/new", H_N1)).toEqual(["reservar-viaje"]);
      expect(
        listForScreen("/finance/operator-payments/advances", H_U07),
      ).toEqual(["registrar-anticipo-operador"]);
    });
  });
});
