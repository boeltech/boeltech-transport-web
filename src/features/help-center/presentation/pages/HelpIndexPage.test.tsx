import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { HelpIndexPage } from "./HelpIndexPage";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.index;

const mockRefetch = vi.fn();
const mockUseHelpArticles = vi.fn();
const mockUseOpenTicketCount = vi.fn();

vi.mock("@shared/hooks", async () => {
  const actual =
    await vi.importActual<typeof import("@shared/hooks")>("@shared/hooks");
  return {
    ...actual,
    useDebounce: (value: string) => value,
  };
});

vi.mock("@shared/config/env", () => ({
  default: {
    help: { ticketsEnabled: true },
    app: { name: "Test" },
    support: { email: "support@test.com" },
    observability: { environment: "test", release: "test" },
  },
}));

vi.mock("../../application", () => ({
  useHelpArticles: (...args: unknown[]) => mockUseHelpArticles(...args),
  useOpenTicketCount: (...args: unknown[]) => mockUseOpenTicketCount(...args),
}));

vi.mock("../../application/trackHelpEvent", () => ({
  trackHelpSearchPerformed: vi.fn(),
}));

const sampleArticle = {
  id: "art-1",
  title: "Cómo facturar un viaje",
  group: "facturacion",
  screens: [],
  roles: [],
  phrase: "Emite el CFDI del flete",
  guide: null,
  problem: null,
  sortOrder: 1,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/ayuda"]}>
      <Routes>
        <Route path="/ayuda" element={<HelpIndexPage />} />
        <Route
          path="/ayuda/:id"
          element={<div data-testid="article-detail">detalle</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HelpIndexPage (F1)", () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUseOpenTicketCount.mockReturnValue({ data: 0 });
    mockUseHelpArticles.mockReturnValue({
      data: [sampleArticle],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it("usa toolbar.search ListingSearchInput y EntityListCard sin menú ⋯ (D3/D9)", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByPlaceholderText(copy.searchPlaceholder),
    ).toBeInTheDocument();
    expect(screen.getByText(sampleArticle.title)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /acciones/i })).not.toBeInTheDocument();
    expect(screen.queryByText("⋯")).not.toBeInTheDocument();

    await user.click(screen.getByText(sampleArticle.title));
    expect(screen.getByTestId("article-detail")).toBeInTheDocument();
  });

  it("búsqueda sin resultados muestra EmptyState con Limpiar búsqueda (D4)", async () => {
    const user = userEvent.setup();
    mockUseHelpArticles.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    renderPage();

    await user.type(
      screen.getByPlaceholderText(copy.searchPlaceholder),
      "zzz",
    );

    expect(screen.getByText(copy.searchNoResults)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.clearSearch }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.emptyTitle)).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar y no empty (D5)", () => {
    mockUseHelpArticles.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    renderPage();

    expect(screen.getByText(copy.loadErrorTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.loadErrorRetry }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.emptyTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.searchNoResults)).not.toBeInTheDocument();
  });
});
