import { describe, expect, it } from "vitest";
import type { HelpArticle } from "../domain";
import { matchHelpScreen } from "../domain/matchHelpScreen";
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
    screens: ["/finance/analysis"],
  }),
  article({
    id: "ver-rentabilidad",
    sortOrder: 150,
    group: "finanzas",
    screens: ["/finance/analysis"],
  }),
  article({
    id: "revisar-gasto-viaje",
    sortOrder: 170,
    group: "finanzas",
    screens: ["/finance/analysis"],
  }),
  article({
    id: "consultar-reportes",
    sortOrder: 160,
    group: "finanzas",
    screens: ["/reports"],
  }),
];

function primaryForPath(
  pathname: string,
  catalog: readonly HelpArticle[] = U07_ARTICLES,
  role?: string,
): string | null {
  const matched = catalog.filter((a) => {
    if (!matchHelpScreen(pathname, a.screens)) return false;
    if (role == null) return true;
    return a.roles.length === 0 || a.roles.includes(role);
  });
  return selectPrimaryHelpArticle(matched)?.id ?? null;
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

    it("sin D2 (hermanas ≥ 130) liquidar gana en Anticipos por :id", () => {
      const preD2 = U07_ARTICLES.map((a) => {
        if (a.id === "registrar-anticipo-operador")
          return { ...a, sortOrder: 135 };
        if (a.id === "perfil-pago-operador") return { ...a, sortOrder: 138 };
        if (a.id === "esquema-compensacion") return { ...a, sortOrder: 140 };
        return a;
      });
      expect(primaryForPath("/finance/operator-payments/advances", preD2)).toBe(
        "liquidar-viaje",
      );
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
});
