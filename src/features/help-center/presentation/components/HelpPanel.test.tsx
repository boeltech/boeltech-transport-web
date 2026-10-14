import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HelpPanel } from "./HelpPanel";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import type { HelpArticle } from "../../domain";

const copy = helpCenterCopy.panel;
const indexCopy = helpCenterCopy.index;

const mockRefetchScreen = vi.fn();
const mockRefetchAll = vi.fn();
const mockRefetchSearch = vi.fn();
const mockUseHelpArticles = vi.fn();
const mockUseHelpArticle = vi.fn();
const mockUseOpenTicketCount = vi.fn();

vi.mock("@shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@shared/hooks")>(
    "@shared/hooks",
  );
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

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "a@b.com", tenant: { name: "T" } } }),
}));

vi.mock("@widgets/header/lib/buildSupportMailto", () => ({
  buildSupportMailto: () => "mailto:support@test.com",
}));

vi.mock("../../application", () => ({
  useHelpArticles: (...args: unknown[]) => mockUseHelpArticles(...args),
  useHelpArticle: (...args: unknown[]) => mockUseHelpArticle(...args),
  useOpenTicketCount: (...args: unknown[]) => mockUseOpenTicketCount(...args),
  useCreateHelpTicket: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../../application/trackHelpEvent", () => ({
  trackHelpSearchPerformed: vi.fn(),
}));

const sampleArticle: HelpArticle = {
  id: "art-1",
  title: "Cómo facturar un viaje",
  group: "facturacion",
  screens: ["/trips"],
  roles: [],
  phrase: "Timbrar el CFDI del viaje",
  guide: "Paso 1",
  problem: null,
  sortOrder: 1,
};

function okQuery(data: HelpArticle[] | undefined = []) {
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/trips"]}>
        <HelpPanel open onOpenChange={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HelpPanel (F2 D7–D8)", () => {
  beforeEach(() => {
    mockRefetchScreen.mockReset();
    mockRefetchAll.mockReset();
    mockRefetchSearch.mockReset();
    mockUseOpenTicketCount.mockReturnValue({ data: 0 });
    mockUseHelpArticle.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseHelpArticles.mockImplementation((filters: { screen?: string; q?: string }) => {
      if (filters?.q) {
        return {
          data: [],
          isLoading: false,
          isError: false,
          refetch: mockRefetchSearch,
        };
      }
      if (filters?.screen) {
        return {
          data: [sampleArticle],
          isLoading: false,
          isError: false,
          refetch: mockRefetchScreen,
        };
      }
      return {
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetchAll,
      };
    });
  });

  it("mantiene secciones y ArticleCard accordion (D7–D8)", () => {
    renderPanel();

    expect(screen.getByText(copy.forThisScreen)).toBeInTheDocument();
    expect(screen.getByText(copy.frequentArticles)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cómo facturar un viaje/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(sampleArticle.phrase)).toBeInTheDocument();
  });

  it("búsqueda sin resultados usa EmptyState sm (D7)", async () => {
    const user = userEvent.setup();
    renderPanel();

    const search = screen.getByPlaceholderText(copy.searchPlaceholder);
    await user.type(search, "xyz");

    await waitFor(() => {
      expect(screen.getByText(copy.noResults)).toBeInTheDocument();
    });
    expect(screen.queryByText(copy.forThisScreen)).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard + Reintentar (D7)", () => {
    mockUseHelpArticles.mockImplementation((filters: { screen?: string; q?: string }) => {
      if (filters?.q) return okQuery([]);
      if (filters?.screen) {
        return {
          data: undefined,
          isLoading: false,
          isError: true,
          refetch: mockRefetchScreen,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetchAll,
      };
    });

    renderPanel();

    expect(screen.getByText(indexCopy.loadErrorTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: indexCopy.loadErrorRetry }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.forThisScreen)).not.toBeInTheDocument();
  });
});
