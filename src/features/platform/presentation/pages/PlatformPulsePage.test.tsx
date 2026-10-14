import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platformCopy } from "../copy/platformCopy";
import { PlatformPulsePage } from "./PlatformPulsePage";

const { mockUsePlatformPulse } = vi.hoisted(() => ({
  mockUsePlatformPulse: vi.fn(),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPulse: (...args: unknown[]) => mockUsePlatformPulse(...args),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PlatformPulsePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformPulsePage F2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows load error with DetailAlertCard Reintentar", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockUsePlatformPulse.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    renderPage();

    expect(screen.getByText(platformCopy.pulse.error.title)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: platformCopy.pulse.error.retry }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it("shows EmptyState when attention queue is empty", () => {
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-14T12:00:00.000Z",
        healthAsOf: null,
        kpis: {
          mrrCents: 0,
          cxcOverdueCents: 0,
          tenantsAtRisk: 0,
          trialsActive: 0,
        },
        attentionQueue: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();

    expect(
      screen.getByText(platformCopy.pulse.queue.empty.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.pulse.queue.empty.description),
    ).toBeInTheDocument();
  });
});
