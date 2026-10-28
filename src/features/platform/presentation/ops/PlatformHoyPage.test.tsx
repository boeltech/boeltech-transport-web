import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformHoyPage } from "./PlatformHoyPage";
import { opsCopy } from "./opsCopy";

const mockUsePlatformPulse = vi.fn();

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPulse: (...args: unknown[]) => mockUsePlatformPulse(...args),
  useResendPlatformTenantActivation: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
  useUpdatePlatformTenantStatus: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../../application/hooks/usePlatformSaasAr", () => ({
  usePlatformTenantSaasInvoices: () => ({
    data: [],
    isLoading: false,
  }),
  useMarkSaasInvoicePaid: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const authState = vi.hoisted(() => ({
  platformRole: "platform_owner" as "platform_owner" | "platform_support",
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: () => ({
    user: {
      id: "u1",
      platformRole: authState.platformRole,
      scope: "platform",
      email: "o@t.com",
      firstName: "O",
      lastName: "T",
    },
  }),
}));

describe("PlatformHoyPage", () => {
  beforeEach(() => {
    authState.platformRole = "platform_owner";
  });

  it("shows queue chips and empty state from pulse", () => {
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-27T12:00:00.000Z",
        healthAsOf: null,
        kpis: {},
        attentionQueue: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<PlatformHoyPage />, { route: ["/platform"] });

    expect(screen.getByTestId("platform-hoy-page")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: new RegExp(opsCopy.hoy.chips.activation),
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ops-hoy-empty")).toBeInTheDocument();
    expect(screen.getByText(opsCopy.hoy.empty.title)).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: new RegExp(opsCopy.hoy.chips.pastDue),
      }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("ops-hoy-queues")).toBeInTheDocument();
  });

  it("opens on cobro pendiente when activation also has rows", () => {
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-27T12:00:00.000Z",
        healthAsOf: null,
        kpis: {},
        attentionQueue: [
          {
            tenantId: "act",
            name: "Alta",
            subdomain: "alta",
            lifecycleStage: "provisioning",
            healthScore: 80,
            reasonCodes: [],
            cxcOverdueCents: 0,
            subscriptionStatus: "active",
            accessStatus: "active",
          },
          {
            tenantId: "due",
            name: "Acme",
            subdomain: "acme",
            lifecycleStage: "active",
            healthScore: 40,
            reasonCodes: ["past_due"],
            cxcOverdueCents: 120000,
            subscriptionStatus: "past_due",
            accessStatus: "active",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<PlatformHoyPage />, { route: ["/platform"] });

    expect(
      screen.getAllByRole("tab").map((tab) => tab.getAttribute("data-ops-hoy-chip")),
    ).toEqual(["past_due", "suspended", "activation", "trial"]);
    expect(
      screen.getByRole("tab", {
        name: new RegExp(opsCopy.hoy.chips.pastDue),
      }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: opsCopy.hoy.cta.registerPayment }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.hoy.cta.resend }),
    ).not.toBeInTheDocument();
  });

  it("opens on activar admin when earlier queues are empty", () => {
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-27T12:00:00.000Z",
        healthAsOf: null,
        kpis: {},
        attentionQueue: [
          {
            tenantId: "act",
            name: "Alta",
            subdomain: "alta",
            lifecycleStage: "provisioning",
            healthScore: 80,
            reasonCodes: [],
            cxcOverdueCents: 0,
            subscriptionStatus: "active",
            accessStatus: "active",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<PlatformHoyPage />, { route: ["/platform"] });

    expect(
      screen.getByRole("tab", {
        name: new RegExp(opsCopy.hoy.chips.activation),
      }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: opsCopy.hoy.cta.resend }),
    ).toBeInTheDocument();
  });

  it("enables register payment and suspend on past_due queue", async () => {
    const user = userEvent.setup();
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-27T12:00:00.000Z",
        healthAsOf: null,
        kpis: {},
        attentionQueue: [
          {
            tenantId: "t1",
            name: "Acme",
            subdomain: "acme",
            lifecycleStage: "active",
            healthScore: 40,
            reasonCodes: ["past_due"],
            cxcOverdueCents: 120000,
            subscriptionStatus: "past_due",
            accessStatus: "active",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<PlatformHoyPage />, { route: ["/platform"] });

    await user.click(
      screen.getByRole("tab", {
        name: new RegExp(opsCopy.hoy.chips.pastDue),
      }),
    );

    expect(
      screen.getByRole("button", { name: opsCopy.hoy.cta.registerPayment }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: opsCopy.hoy.cta.suspend }),
    ).toBeEnabled();
  });

  it("hides mutation buttons for platform_support and keeps view links", async () => {
    const user = userEvent.setup();
    authState.platformRole = "platform_support";
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-27T12:00:00.000Z",
        healthAsOf: null,
        kpis: {},
        attentionQueue: [
          {
            tenantId: "due",
            name: "Acme",
            subdomain: "acme",
            lifecycleStage: "active",
            healthScore: 40,
            reasonCodes: ["past_due"],
            cxcOverdueCents: 120000,
            subscriptionStatus: "past_due",
            accessStatus: "active",
          },
          {
            tenantId: "trial",
            name: "Prueba",
            subdomain: "prueba",
            lifecycleStage: "trialing",
            healthScore: 80,
            reasonCodes: [],
            cxcOverdueCents: 0,
            subscriptionStatus: "trialing",
            accessStatus: "active",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<PlatformHoyPage />, { route: ["/platform"] });

    expect(
      screen.queryByRole("button", { name: opsCopy.hoy.cta.registerPayment }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.hoy.cta.suspend }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.hoy.cta.resend }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.hoy.cta.reactivate }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: opsCopy.hoy.view }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: new RegExp(opsCopy.hoy.chips.trial) }),
    );

    expect(
      screen.getByRole("link", { name: opsCopy.hoy.cta.viewHub }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.hoy.cta.viewHub }),
    ).not.toBeInTheDocument();
  });
});
