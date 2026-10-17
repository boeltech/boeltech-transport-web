import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ActivationData } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DashboardActivationChecklist,
  DASHBOARD_ACTIVATION_STORAGE_KEY_PREFIX,
  getDashboardActivationStorageKey,
} from "./DashboardActivationChecklist";

const { mockUseAuth, mockUseDashboardActivation } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseDashboardActivation: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../application/hooks/useDashboardActivation", () => ({
  useDashboardActivation: (opts?: { enabled?: boolean }) =>
    mockUseDashboardActivation(opts),
}));

vi.mock("../../application/hooks/useDemoSeed", () => ({
  useApplyDemoSeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const copy = dashboardCopy.activation;
const demoCopy = dashboardCopy.demoSeed;

const emptyActivation: ActivationData = {
  opsLevel: "empty",
  fiscalTrack: {
    companyRfcSet: false,
    certificateConfigured: false,
    readyHint: "missing_rfc",
  },
  counts: {
    clients: 0,
    vehicles: 0,
    drivers: 0,
    tripsNonCancelled: 0,
    usersNonAdmin: 0,
  },
  items: [
    {
      code: "client",
      status: "pending",
      requiredForOps: true,
      ctaPath: "/clients/new",
      canAct: true,
    },
    {
      code: "vehicle",
      status: "pending",
      requiredForOps: true,
      ctaPath: "/vehicles/new",
      canAct: true,
    },
    {
      code: "first_trip",
      status: "pending",
      requiredForOps: true,
      ctaPath: "/trips/new",
      canAct: false,
    },
    {
      code: "company_fiscal",
      status: "pending",
      requiredForOps: false,
      ctaPath: "/settings/general",
      canAct: true,
    },
  ],
  demo: {
    hasDemoData: false,
    seedAvailable: false,
    purgeAllowed: false,
  },
  dismissed: false,
};

function renderChecklist(
  role: string,
  storageKey?: string,
  activation: ActivationData = emptyActivation,
) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: {
      id: "user-1",
      role,
      tenant: { id: "tenant-1" },
    },
  });
  mockUseDashboardActivation.mockReturnValue({
    data: activation,
    isLoading: false,
    isError: false,
  });

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardActivationChecklist storageKey={storageKey} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function clearActivationStorage() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(DASHBOARD_ACTIVATION_STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

describe("DashboardActivationChecklist", () => {
  beforeEach(() => {
    clearActivationStorage();
    mockUseDashboardActivation.mockReset();
  });

  it("admin ve checklist con CTA a gap pendiente", () => {
    renderChecklist("admin");

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.ctaLabels.client }),
    ).toHaveAttribute("href", "/clients/new");
  });

  it("dispatcher ve modo compacto mid-setup", () => {
    renderChecklist("dispatcher");

    expect(screen.getByText(copy.titleDispatcher)).toBeInTheDocument();
    expect(
      screen.getByText(copy.descriptionDispatcherEmpty),
    ).toBeInTheDocument();
  });

  it("accountant ve pista fiscal", () => {
    renderChecklist("accountant");

    expect(screen.getByText(copy.titleAccountant)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.ctaLabels.company_fiscal }),
    ).toHaveAttribute("href", "/settings/general");
  });

  it("operator no ve el panel", () => {
    renderChecklist("operator");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(mockUseDashboardActivation).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("dismiss guarda localStorage por tenant+user", async () => {
    const user = userEvent.setup();
    const key = getDashboardActivationStorageKey("tenant-1", "user-1");
    renderChecklist("admin", key);

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(key)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });

  it("admin ve CTA seed cuando seedAvailable", () => {
    renderChecklist("admin", undefined, {
      ...emptyActivation,
      demo: {
        hasDemoData: false,
        seedAvailable: true,
        purgeAllowed: false,
      },
    });

    expect(
      screen.getByRole("button", { name: demoCopy.loadCta }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: demoCopy.startCleanCta }),
    ).toBeInTheDocument();
  });

  it("no ofrece CTA seed cuando seedAvailable es false (kill-switch off)", () => {
    renderChecklist("admin");

    expect(
      screen.queryByRole("button", { name: demoCopy.loadCta }),
    ).not.toBeInTheDocument();
  });
});
