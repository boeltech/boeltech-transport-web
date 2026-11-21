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
});
