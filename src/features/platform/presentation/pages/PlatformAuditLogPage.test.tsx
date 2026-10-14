import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platformCopy } from "../copy/platformCopy";
import { PlatformAuditLogPage } from "./PlatformAuditLogPage";

const {
  mockUsePlatformAuditLog,
  mockUsePlatformPlans,
  mockUsePlatformTenant,
} = vi.hoisted(() => ({
  mockUsePlatformAuditLog: vi.fn(),
  mockUsePlatformPlans: vi.fn(),
  mockUsePlatformTenant: vi.fn(),
}));

vi.mock("../../application/hooks/usePlatformAuditLog", () => ({
  usePlatformAuditLog: (...args: unknown[]) => mockUsePlatformAuditLog(...args),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPlans: (...args: unknown[]) => mockUsePlatformPlans(...args),
  usePlatformTenant: (...args: unknown[]) => mockUsePlatformTenant(...args),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage(url = "/platform/audit") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <PlatformAuditLogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformAuditLogPage F2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformPlans.mockReturnValue({ data: [] });
    mockUsePlatformTenant.mockReturnValue({ data: undefined });
    mockUsePlatformAuditLog.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 0, total: 0, limit: 20 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("puts action and date in ListingFilterPanel", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.queryByLabelText(platformCopy.audit.filters.action),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(platformCopy.audit.filters.showFilters, "i"),
      }),
    );

    expect(
      screen.getByLabelText(platformCopy.audit.filters.action),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.audit.filters.datePlaceholder,
      }),
    ).toBeInTheDocument();
  });

  it("shows load error with DetailAlertCard Reintentar action", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockUsePlatformAuditLog.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    });
    renderPage();

    expect(screen.getByText(platformCopy.audit.error.title)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: platformCopy.audit.error.retry }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it("shows tenant scope with DetailAlertCard clear action", async () => {
    const user = userEvent.setup();
    mockUsePlatformTenant.mockReturnValue({
      data: { id: "t1", subdomain: "norte", name: "Norte" },
    });
    renderPage("/platform/audit?targetTenantId=t1");

    expect(
      screen.getByText(platformCopy.audit.tenantFilter.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.audit.tenantFilter.description("norte")),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.audit.tenantFilter.clear,
      }),
    );
    expect(
      screen.queryByText(platformCopy.audit.tenantFilter.title),
    ).not.toBeInTheDocument();
  });
});
