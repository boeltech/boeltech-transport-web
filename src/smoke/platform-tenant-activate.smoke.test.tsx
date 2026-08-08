/**
 * Smoke ADR-0073 — activación admin al alta Platform (Fase 3).
 * Mock de API; no requiere backend ni Playwright.
 *
 * Cobertura: create notice (password offline) → card detalle pending/resend
 * → `/activate-tenant` accept → CTA login (sin erp_platform_*).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  PlatformAdminActivation,
  PlatformUserJSON,
} from "@features/platform/domain/entities";
import { PlatformTenantCreatePage } from "@features/platform/presentation/pages/PlatformTenantCreatePage";
import { TenantAdminActivationCard } from "@features/platform/presentation/components/TenantAdminActivationCard";
import { PlatformAuthProvider } from "@features/platform/presentation/providers/PlatformAuthProvider";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "@features/platform/infrastructure/platformTokenStorage";
import { platformCopy } from "@features/platform/presentation/copy/platformCopy";
import { ActivateTenantPage } from "@features/tenant-activations";
import { tenantActivationCopy } from "@features/tenant-activations/presentation/copy/tenantActivationCopy";
import { tenantActivationsApi } from "@features/tenant-activations/infrastructure/tenantActivationsApi";

const TENANT_ID = "tenant-activate-smoke-1";

const mockListPlans = vi.fn();
const mockCreateTenant = vi.fn();
const mockResendAdminActivation = vi.fn();
const mockGetProfile = vi.fn();

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
    listPlans: (...args: unknown[]) => mockListPlans(...args),
    createTenant: (...args: unknown[]) => mockCreateTenant(...args),
    resendAdminActivation: (...args: unknown[]) =>
      mockResendAdminActivation(...args),
    rotateAdminCredentials: vi.fn(),
    getTenantById: vi.fn(),
    listTenants: vi.fn(),
    getMetrics: vi.fn(),
  },
}));

vi.mock("@features/tenant-activations/infrastructure/tenantActivationsApi", () => ({
  tenantActivationsApi: {
    verify: vi.fn(),
    accept: vi.fn(),
  },
}));

const toastMock = vi.fn();
vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: toastMock }),
  };
});

const mockedTenantActivationsApi = vi.mocked(tenantActivationsApi);

const PLATFORM_OWNER: PlatformUserJSON = {
  id: "user-platform-smoke",
  email: "platform@boeltech.com",
  firstName: "Platform",
  lastName: "Owner",
  platformRole: "platform_owner",
  scope: "platform",
  mfaEnabled: true,
  mfaEnabledAt: "2026-01-01T00:00:00.000Z",
};

const PENDING_ACTIVATION: PlatformAdminActivation = {
  status: "pending",
  email: "admin@nueva.mx",
  expiresAt: "2026-08-14T18:00:00.000Z",
  lastSentAt: "2026-08-07T18:00:00.000Z",
  lastSendError: null,
  sendAttempts: 1,
};

function seedPlatformSession(user: PlatformUserJSON = PLATFORM_OWNER) {
  localStorage.clear();
  sessionStorage.clear();
  platformTokenStorage.setToken("smoke-platform-token");
  platformTokenStorage.setRefreshToken("smoke-platform-refresh");
  platformTokenStorage.setUser(user);
  markPlatformFreshLoginSession();
}

function renderWithProviders(ui: ReactNode, initialEntry = "/platform/tenants/new") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PlatformAuthProvider>{ui}</PlatformAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderActivationCard(canMutate: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantAdminActivationCard
          tenantId={TENANT_ID}
          activation={PENDING_ACTIVATION}
          canMutate={canMutate}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderActivatePage(search = "?token=good-token") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/activate-tenant${search}`]}>
        <Routes>
          <Route path="/activate-tenant" element={<ActivateTenantPage />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke platform tenant admin activation (ADR-0073)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedPlatformSession();
    mockGetProfile.mockResolvedValue(PLATFORM_OWNER);
    mockListPlans.mockResolvedValue([
      {
        code: "operacion_esencial",
        name: "Operación Esencial",
        maxUsers: 5,
        maxBranches: 2,
        historyMonths: 12,
        isActive: true,
        monthlyPriceCents: 74900,
        annualPriceCents: null,
        includedStamps: 15,
        overagePriceCents: 0,
        quotaPolicy: "soft_cap",
        features: {},
      },
    ]);
    mockResendAdminActivation.mockResolvedValue({
      data: { ...PENDING_ACTIVATION, sendAttempts: 2 },
      message: "Invitación de activación reenviada",
    });
  });

  it("create page states password is offline and activation email is sent", async () => {
    renderWithProviders(<PlatformTenantCreatePage />);

    expect(
      await screen.findByText(platformCopy.tenants.create.notice.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.tenants.create.notice.description),
    ).toBeInTheDocument();
    expect(platformCopy.tenants.create.notice.description).toMatch(
      /no va en el correo/i,
    );
    expect(platformCopy.tenants.create.hints.adminPassword).toMatch(
      /no se envía por correo/i,
    );
  });

  it("detail activation card shows resend for owner", async () => {
    const user = userEvent.setup();
    renderActivationCard(true);

    const resendButton = screen.getByRole("button", {
      name: platformCopy.tenants.detail.adminActivation.resend,
    });
    expect(resendButton).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.rotate,
      }),
    ).toBeInTheDocument();

    await user.click(resendButton);
    await waitFor(() => {
      expect(mockResendAdminActivation).toHaveBeenCalledWith(TENANT_ID);
    });
  });

  it("detail activation card hides mutating CTAs for support", () => {
    renderActivationCard(false);

    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.detail.adminActivation.resend,
      }),
    ).toBeNull();
    expect(
      screen.getByText(platformCopy.tenants.detail.adminActivation.readOnlyHint),
    ).toBeInTheDocument();
  });

  it("activate-tenant verifies, accepts, links to login, and skips platform storage writes", async () => {
    const user = userEvent.setup();
    const setTokenSpy = vi.spyOn(platformTokenStorage, "setToken");
    const setUserSpy = vi.spyOn(platformTokenStorage, "setUser");
    const setRefreshSpy = vi.spyOn(platformTokenStorage, "setRefreshToken");

    mockedTenantActivationsApi.verify.mockResolvedValue({
      emailMasked: "a***@nueva.mx",
      companyName: "Transportes Nueva",
      subdomain: "nueva",
      expiresAt: "2026-08-14T18:00:00.000Z",
    });
    mockedTenantActivationsApi.accept.mockResolvedValue({
      message: "OK",
      data: { subdomain: "nueva", emailMasked: "a***@nueva.mx" },
    });

    // Clear session so accept path cannot rely on platform login leftovers.
    localStorage.clear();
    sessionStorage.clear();
    setTokenSpy.mockClear();
    setUserSpy.mockClear();
    setRefreshSpy.mockClear();

    renderActivatePage("?token=good-token");

    expect(
      await screen.findByRole("button", {
        name: tenantActivationCopy.activate,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Transportes Nueva")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: tenantActivationCopy.activate }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(tenantActivationCopy.successTitle),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: tenantActivationCopy.successCta }),
    ).toHaveAttribute("href", "/login?subdomain=nueva");

    expect(setTokenSpy).not.toHaveBeenCalled();
    expect(setUserSpy).not.toHaveBeenCalled();
    expect(setRefreshSpy).not.toHaveBeenCalled();

    setTokenSpy.mockRestore();
    setUserSpy.mockRestore();
    setRefreshSpy.mockRestore();
  });
});
