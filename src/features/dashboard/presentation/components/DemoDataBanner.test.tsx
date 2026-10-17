import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ActivationData } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DemoDataBanner,
  DEMO_DATA_BANNER_STORAGE_KEY_PREFIX,
  getDemoDataBannerStorageKey,
} from "./DemoDataBanner";

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
  usePurgeDemoSeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const copy = dashboardCopy.demoSeed;

const baseActivation: ActivationData = {
  opsLevel: "l1_ready",
  fiscalTrack: {
    companyRfcSet: false,
    certificateConfigured: false,
    readyHint: "missing_rfc",
  },
  counts: {
    clients: 1,
    vehicles: 1,
    drivers: 1,
    tripsNonCancelled: 1,
    usersNonAdmin: 0,
  },
  items: [],
  demo: {
    hasDemoData: true,
    seedAvailable: false,
    purgeAllowed: true,
  },
  dismissed: false,
};

function renderBanner(activation: ActivationData = baseActivation) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: {
      id: "user-1",
      role: "admin",
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
  const key = getDemoDataBannerStorageKey("tenant-1", "user-1");
  return render(
    <QueryClientProvider client={client}>
      <DemoDataBanner storageKey={key} />
    </QueryClientProvider>,
  );
}

function clearBannerStorage() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(DEMO_DATA_BANNER_STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

describe("DemoDataBanner", () => {
  beforeEach(() => {
    clearBannerStorage();
    mockUseDashboardActivation.mockReset();
  });

  it("muestra banner cuando hasDemoData", () => {
    renderBanner();
    expect(screen.getByText(copy.bannerTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.bannerBody)).toBeInTheDocument();
  });

  it("oculta banner si no hay datos demo", () => {
    renderBanner({
      ...baseActivation,
      demo: {
        hasDemoData: false,
        seedAvailable: true,
        purgeAllowed: false,
      },
    });
    expect(screen.queryByText(copy.bannerTitle)).not.toBeInTheDocument();
  });

  it("muestra CTA purge cuando purgeAllowed", () => {
    renderBanner();
    expect(
      screen.getByRole("button", { name: copy.purgeCta }),
    ).toBeInTheDocument();
  });

  it("no muestra CTA purge si purgeAllowed es false", () => {
    renderBanner({
      ...baseActivation,
      demo: {
        hasDemoData: true,
        seedAvailable: false,
        purgeAllowed: false,
      },
    });
    expect(
      screen.queryByRole("button", { name: copy.purgeCta }),
    ).not.toBeInTheDocument();
  });

  it("dismiss guarda localStorage y oculta el banner", async () => {
    const user = userEvent.setup();
    const key = getDemoDataBannerStorageKey("tenant-1", "user-1");
    renderBanner();

    await user.click(screen.getByRole("button", { name: copy.bannerDismiss }));
    expect(window.localStorage.getItem(key)).toBe("true");
    expect(screen.queryByText(copy.bannerTitle)).not.toBeInTheDocument();
  });
});
