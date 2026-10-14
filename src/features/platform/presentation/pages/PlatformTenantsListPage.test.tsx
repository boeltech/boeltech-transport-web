import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTenantsListPage } from "./PlatformTenantsListPage";

const { mockUsePlatformTenants, mockUsePlatformPlans, mockUsePlatformAuth } =
  vi.hoisted(() => ({
    mockUsePlatformTenants: vi.fn(),
    mockUsePlatformPlans: vi.fn(),
    mockUsePlatformAuth: vi.fn(),
  }));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformTenants: (...args: unknown[]) => mockUsePlatformTenants(...args),
  usePlatformPlans: (...args: unknown[]) => mockUsePlatformPlans(...args),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage(url = "/platform/tenants") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <PlatformTenantsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformTenantsListPage F2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u1",
        email: "ops@test.com",
        firstName: "Ops",
        lastName: "Test",
        platformRole: "platform_owner",
        scope: "platform",
      },
    });
    mockUsePlatformPlans.mockReturnValue({
      data: [{ code: "operacion_crecimiento", name: "Crecimiento" }],
    });
    mockUsePlatformTenants.mockReturnValue({
      data: {
        data: [
          {
            id: "t1",
            name: "Transportes Norte",
            subdomain: "norte",
            status: "active",
            planCode: "operacion_crecimiento",
            planName: "Crecimiento",
            healthScore: 80,
            lifecycleStage: "active",
            subscriptionStatus: "active",
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 20 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it("collapses filters in ListingFilterPanel and keeps search outside", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByPlaceholderText(platformCopy.tenants.list.searchPlaceholder),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(platformCopy.tenants.list.filters.access),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(platformCopy.tenants.list.filters.showFilters, "i"),
      }),
    );

    expect(
      screen.getByLabelText(platformCopy.tenants.list.filters.access),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(platformCopy.tenants.list.filters.commercial),
    ).toBeInTheDocument();
  });

  it("renders mobile rows with EntityListCard", () => {
    renderPage();
    const cards = document.querySelectorAll(".group.cursor-pointer");
    expect(cards.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transportes Norte").length).toBeGreaterThan(0);
  });

  it("uses distinct empty copy for filtered vs onboarding", () => {
    mockUsePlatformTenants.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 0, total: 0, limit: 20 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    const { unmount } = renderPage();
    expect(
      screen.getByText(platformCopy.tenants.list.empty.title),
    ).toBeInTheDocument();
    unmount();

    renderPage("/platform/tenants?status=active");
    expect(
      screen.getByText(platformCopy.tenants.list.empty.searchTitle),
    ).toBeInTheDocument();
  });
});
