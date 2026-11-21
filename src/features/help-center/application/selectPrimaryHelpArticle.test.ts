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
): string | null {
  const matched = catalog.filter((a) => matchHelpScreen(pathname, a.screens));
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
