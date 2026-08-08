import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TenantAdminActivationCard } from "./TenantAdminActivationCard";
import { platformCopy } from "../copy/platformCopy";
import type { PlatformAdminActivation } from "../../domain/entities";

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  useResendPlatformTenantActivation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRotatePlatformAdminCredentials: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const pendingActivation: PlatformAdminActivation = {
  status: "pending",
  email: "admin@demo.mx",
  expiresAt: "2026-08-14T18:00:00.000Z",
  lastSentAt: "2026-08-07T18:00:00.000Z",
  lastSendError: null,
  sendAttempts: 1,
};

function renderCard(canMutate: boolean, activation = pendingActivation) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantAdminActivationCard
          tenantId="tenant-1"
          activation={activation}
          canMutate={canMutate}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TenantAdminActivationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows resend and rotate for platform owner when pending", () => {
    renderCard(true);
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.resend,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.rotate,
      }),
    ).toBeInTheDocument();
  });

  it("hides mutating CTAs for support (read-only)", () => {
    renderCard(false);
    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.resend,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.rotate,
      }),
    ).toBeNull();
    expect(
      screen.getByText(platformCopy.tenants.detail.adminActivation.readOnlyHint),
    ).toBeInTheDocument();
  });

  it("hides CTAs when activated", () => {
    renderCard(true, {
      ...pendingActivation,
      status: "activated",
      lastSendError: null,
    });
    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.resend,
      }),
    ).toBeNull();
  });
});
