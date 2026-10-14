import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTenantCreatePage } from "./PlatformTenantCreatePage";

const {
  mockUsePlatformAuth,
  mockUsePlatformPlans,
  mockUseCreatePlatformTenant,
} = vi.hoisted(() => ({
  mockUsePlatformAuth: vi.fn(),
  mockUsePlatformPlans: vi.fn(),
  mockUseCreatePlatformTenant: vi.fn(),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPlans: (...args: unknown[]) => mockUsePlatformPlans(...args),
  useCreatePlatformTenant: (...args: unknown[]) =>
    mockUseCreatePlatformTenant(...args),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

// Data router required: useUnsavedChangesGuard → useBlocker.
function renderCreatePage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/platform/tenants/new",
        element: (
          <QueryClientProvider client={client}>
            <PlatformTenantCreatePage />
          </QueryClientProvider>
        ),
      },
      {
        path: "/platform/tenants",
        element: <div>Lista</div>,
      },
    ],
    { initialEntries: ["/platform/tenants/new"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("PlatformTenantCreatePage F3 (D9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u1",
        email: "owner@test.com",
        firstName: "Owner",
        lastName: "Test",
        platformRole: "platform_owner",
        scope: "platform",
      },
    });
    mockUsePlatformPlans.mockReturnValue({
      data: [
        {
          code: "operacion_pequena",
          name: "Operación Pequeña",
          monthlyPriceCents: 0,
          maxUsers: 5,
          maxBranches: 2,
          includedStamps: 100,
        },
      ],
      isLoading: false,
    });
    mockUseCreatePlatformTenant.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("monta FormStickyActions sticky y CTAs de cancelar/crear", () => {
    const { container } = renderCreatePage();
    const copy = platformCopy.tenants.create;

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(container.querySelector(".sticky.bottom-0")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: copy.cancel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.submit }),
    ).toBeInTheDocument();
  });

  it("redirige support (reader) fuera del alta", async () => {
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u2",
        email: "support@test.com",
        firstName: "Support",
        lastName: "Test",
        platformRole: "platform_support",
        scope: "platform",
      },
    });

    renderCreatePage();

    expect(await screen.findByText("Lista")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.create.submit,
      }),
    ).not.toBeInTheDocument();
  });
});
