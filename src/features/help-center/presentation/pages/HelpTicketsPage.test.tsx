import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HelpTicketsPage } from "./HelpTicketsPage";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.tickets;
const createCopy = helpCenterCopy.createTicket;
const pausedCopy = helpCenterCopy.ticketsPaused;

const mockRefetch = vi.fn();
const mockUseHelpTickets = vi.fn();

const { configState } = vi.hoisted(() => ({
  configState: { ticketsEnabled: true },
}));

vi.mock("@shared/config/env", () => ({
  default: {
    get help() {
      return { ticketsEnabled: configState.ticketsEnabled };
    },
    api: {
      baseUrl: "http://localhost/api/v1",
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    },
    app: { name: "Test" },
    support: { email: "support@test.com" },
    observability: { environment: "test", release: "test" },
  },
}));

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "a@b.com", tenant: { name: "T" } } }),
}));

vi.mock("../../application", () => ({
  useHelpTickets: (...args: unknown[]) => mockUseHelpTickets(...args),
  useCreateHelpTicket: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@widgets/header/lib/buildSupportMailto", () => ({
  buildSupportMailto: () => "mailto:support@test.com",
}));

const sampleTicket = {
  id: "tk-1",
  status: "open",
  route: "/trips",
  articleId: "art-1",
  articleTitle: "Artículo",
  bodyPreview: "Necesito ayuda",
  hasAttachment: false,
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/ayuda/tickets"]}>
        <Routes>
          <Route path="/ayuda/tickets" element={<HelpTicketsPage />} />
          <Route path="/ayuda" element={<div data-testid="help-index">ayuda</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HelpTicketsPage (F1 + F2)", () => {
  beforeEach(() => {
    configState.ticketsEnabled = true;
    mockRefetch.mockReset();
    mockUseHelpTickets.mockReturnValue({
      data: {
        items: [sampleTicket],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it("lista tickets en ListPageShell", () => {
    renderPage();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(sampleTicket.bodyPreview)).toBeInTheDocument();
  });

  it("primaryAction Nuevo ticket abre CreateTicketSheet (D10)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: createCopy.title }),
    );

    expect(
      await screen.findByRole("heading", { name: createCopy.title }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
  });

  it("empty CTA Nuevo ticket abre el mismo Sheet (D10 / CA4)", async () => {
    const user = userEvent.setup();
    mockUseHelpTickets.mockReturnValue({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    renderPage();

    expect(screen.getByText(copy.emptyTitle)).toBeInTheDocument();
    const emptyCtas = screen.getAllByRole("button", {
      name: createCopy.title,
    });
    expect(emptyCtas.length).toBeGreaterThanOrEqual(2);

    await user.click(emptyCtas[emptyCtas.length - 1]!);

    expect(
      await screen.findByRole("heading", { name: createCopy.title }),
    ).toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar y no empty (D5)", () => {
    mockUseHelpTickets.mockReturnValue({
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
  });

  it("tickets pausados usan EmptyState con mailto y Volver (D6)", () => {
    configState.ticketsEnabled = false;
    renderPage();

    expect(screen.getByTestId("help-tickets-paused")).toBeInTheDocument();
    expect(screen.getByText(pausedCopy.title)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: helpCenterCopy.panel.contactByEmail,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: pausedCopy.backToHelp }),
    ).toBeInTheDocument();
  });
});
