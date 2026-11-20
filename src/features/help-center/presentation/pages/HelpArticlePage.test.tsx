import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { HelpArticlePage } from "./HelpArticlePage";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.detail;
const feedbackCopy = helpCenterCopy.feedback;

const mockRefetch = vi.fn();
const mockUseHelpArticle = vi.fn();

vi.mock("@shared/config/env", () => ({
  default: {
    help: { ticketsEnabled: false },
    app: { name: "Test" },
    support: { email: "support@test.com" },
    observability: { environment: "test", release: "test" },
  },
}));

vi.mock("@widgets/header/lib/buildSupportMailto", () => ({
  buildSupportMailto: () => "mailto:support@test.com",
}));

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      email: "a@b.com",
      role: "dispatcher",
      tenant: { name: "T" },
    },
  }),
}));

vi.mock("../../application", () => ({
  useHelpArticle: (...args: unknown[]) => mockUseHelpArticle(...args),
}));

vi.mock("../../application/trackHelpEvent", () => ({
  trackHelpEvent: vi.fn(),
}));

vi.mock("../../infrastructure/helpSessionFlags", () => ({
  markHelpArticleViewed: vi.fn(),
  hasHelpFeedback: vi.fn(() => false),
  setHelpFeedback: vi.fn(),
  markHelpFeedback: vi.fn(),
}));

const sampleArticle = {
  id: "seguir-viaje",
  title: "Despachar y cerrar un viaje",
  group: "viajes",
  screens: [],
  roles: ["admin", "manager", "dispatcher", "operator"],
  phrase: "Despachas el viaje Programado, operas cargas en cada parada y lo cierras en destino.",
  guide:
    "1. Revisa que el viaje esté en **Programado**.\n2. Abre el tab **Seguimiento**.",
  problem:
    "- **No aparece Despachar….** El viaje no está en **Programado**.\n\nSi el error persiste, escribe a soporte.",
  notCovered: "- Confirmar la reserva: ve **Completar y confirmar una reserva**.",
  sortOrder: 1,
};

function renderPage(id = "seguir-viaje") {
  return render(
    <MemoryRouter initialEntries={[`/ayuda/${id}`]}>
      <Routes>
        <Route path="/ayuda/:id" element={<HelpArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const SECTION_SELECTOR = [
  "[data-help-phrase]",
  "[data-help-roles]",
  "[data-help-steps]",
  "[data-help-problem]",
  "[data-help-support]",
  "[data-help-not-covered]",
  "[data-help-feedback]",
].join(", ");

function sectionOrder(): string[] {
  const layout = document.querySelector('[data-help-article-layout="a"]');
  if (!layout) return [];
  return Array.from(layout.querySelectorAll(SECTION_SELECTOR)).map((el) => {
    if (el.hasAttribute("data-help-phrase")) return "phrase";
    if (el.hasAttribute("data-help-roles")) return "roles";
    if (el.hasAttribute("data-help-steps")) return "steps";
    if (el.hasAttribute("data-help-problem")) return "problem";
    if (el.hasAttribute("data-help-support")) return "support";
    if (el.hasAttribute("data-help-not-covered")) return "notCovered";
    return "feedback";
  });
}

describe("HelpArticlePage (V4 ancla)", () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUseHelpArticle.mockReturnValue({
      data: sampleArticle,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it("renderiza el artículo en DetailPageShell con layout variante A", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: sampleArticle.title }),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-help-article-layout="a"]'),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.stepsSection)).toBeInTheDocument();
  });

  it("muestra el orden V3: frase → roles → pasos → si falla → soporte → qué no cubre → feedback", () => {
    renderPage();
    expect(sectionOrder()).toEqual([
      "phrase",
      "roles",
      "steps",
      "problem",
      "support",
      "notCovered",
      "feedback",
    ]);
  });

  it("chips de rol con el rol del usuario resaltado", () => {
    renderPage();
    const roles = document.querySelector("[data-help-roles]");
    expect(roles).toBeTruthy();
    expect(within(roles as HTMLElement).getByText("Administrador")).toBeInTheDocument();
    expect(within(roles as HTMLElement).getByText("Despachador")).toBeInTheDocument();
    const me = roles!.querySelector('[data-help-role-me="true"]');
    expect(me).toBeTruthy();
    expect(me).toHaveAttribute("data-help-role", "dispatcher");
    expect(me!.textContent).toMatch(/Despachador/);
  });

  it("pone ¿Te sirvió? al final (después de Qué no cubre y Si falla)", () => {
    renderPage();
    const order = sectionOrder();
    expect(order.indexOf("feedback")).toBeGreaterThan(order.indexOf("problem"));
    expect(order.indexOf("feedback")).toBeGreaterThan(order.indexOf("notCovered"));
    expect(order[order.length - 1]).toBe("feedback");
    expect(screen.getByText(feedbackCopy.question)).toBeInTheDocument();
  });

  it("muestra Si falla abierto (sin collapsible) y mailto de soporte", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 2, name: copy.problemSection }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No aparece Despachar/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.writeSupport }),
    ).toHaveAttribute("href", "mailto:support@test.com");
  });

  it("muestra «Qué no cubre» cuando notCovered tiene texto", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.notCoveredSection,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Completar y confirmar una reserva/),
    ).toBeInTheDocument();
  });

  it("oculta «Qué no cubre» si notCovered falta", () => {
    mockUseHelpArticle.mockReturnValue({
      data: { ...sampleArticle, notCovered: null },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });
    renderPage();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: copy.notCoveredSection,
      }),
    ).not.toBeInTheDocument();
  });

  it("oculta «Qué no cubre» si notCovered es solo whitespace", () => {
    mockUseHelpArticle.mockReturnValue({
      data: { ...sampleArticle, notCovered: "   " },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });
    renderPage();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: copy.notCoveredSection,
      }),
    ).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard+Reintentar y no notFound (D5)", () => {
    mockUseHelpArticle.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { isAxiosError: true, response: { status: 500 } },
      refetch: mockRefetch,
    });

    renderPage();

    expect(screen.getByText(copy.loadErrorTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.loadErrorRetry }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.notFoundTitle)).not.toBeInTheDocument();
  });

  it("404 se presenta como notFound, no como error de carga (D5)", () => {
    mockUseHelpArticle.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { isAxiosError: true, response: { status: 404 } },
      refetch: mockRefetch,
    });

    renderPage();

    expect(screen.getByText(copy.notFoundTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.loadErrorTitle)).not.toBeInTheDocument();
  });
});
