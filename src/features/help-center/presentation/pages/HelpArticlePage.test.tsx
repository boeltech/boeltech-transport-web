import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { HelpArticlePage } from "./HelpArticlePage";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.detail;

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

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "a@b.com", tenant: { name: "T" } } }),
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
}));

const sampleArticle = {
  id: "art-1",
  title: "Cómo facturar un viaje",
  group: "facturacion",
  screens: [],
  roles: [],
  phrase: "Emite el CFDI del flete",
  guide: "Paso 1",
  problem: null,
  sortOrder: 1,
};

function renderPage(id = "art-1") {
  return render(
    <MemoryRouter initialEntries={[`/ayuda/${id}`]}>
      <Routes>
        <Route path="/ayuda/:id" element={<HelpArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HelpArticlePage (F1)", () => {
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

  it("renderiza el artículo en DetailPageShell", () => {
    renderPage();
    expect(screen.getByText(sampleArticle.title)).toBeInTheDocument();
    expect(screen.getByText(copy.stepsSection)).toBeInTheDocument();
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
