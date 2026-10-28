import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { platformCopy } from "../copy/platformCopy";
import { PlatformHoyPage } from "./PlatformHoyPage";
import { opsCopy } from "./opsCopy";

function hoyDesktop() {
  return screen.getByTestId("ops-hoy-desktop-table");
}

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

  it("shows KPI strip, queue chips and empty state from pulse", () => {
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
    expect(screen.getByTestId("ops-kpi-strip")).toBeInTheDocument();
    expect(document.querySelector('[data-ops-kpi-cell="mora"]')).toHaveTextContent(
      opsCopy.hoy.kpi.mora.label,
    );
    expect(
      document.querySelector('[data-ops-kpi-cell="suspended"]'),
    ).toHaveTextContent(opsCopy.hoy.kpi.suspended.label);
    expect(
      document.querySelector('[data-ops-kpi-cell="activation"]'),
    ).toHaveTextContent(opsCopy.hoy.kpi.activation.label);
    expect(document.querySelector('[data-ops-kpi-cell="trial"]')).toHaveTextContent(
      opsCopy.hoy.kpi.trial.label,
    );
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
    expect(screen.getByTestId("ops-kpi-value-mora")).toHaveTextContent("$1.2k");
    expect(screen.getByTestId("ops-kpi-value-mora")).toHaveAttribute(
      "data-tone",
      "warn",
    );
    const desktop = hoyDesktop();
    const acmeRow = within(desktop).getByText("Acme").closest("tr");
    const nameLink = within(desktop).getByRole("link", { name: "Acme" });
    expect(nameLink).toHaveClass("ops-text");
    expect(nameLink).not.toHaveClass("ops-text-accent");
    const planCell = acmeRow?.querySelectorAll("td")[1];
    // Plan ≠ Señal: past_due → «Cobro pendiente» es eco de reason; em dash.
    expect(planCell).toHaveTextContent("—");
    expect(planCell?.textContent).not.toMatch(/Cobro pendiente|past_due/);
    expect(acmeRow).toHaveTextContent(
      platformCopy.pulse.reasonCodes.past_due,
    );
    expect(
      within(desktop).getByRole("button", {
        name: opsCopy.hoy.cta.registerPayment,
      }),
    ).toBeInTheDocument();
    expect(
      within(desktop).queryByRole("button", { name: opsCopy.hoy.cta.resend }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("ops-hoy-mobile-list")).toBeInTheDocument();
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
      within(hoyDesktop()).getByRole("button", {
        name: opsCopy.hoy.cta.resend,
      }),
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

    const desktop = hoyDesktop();
    expect(
      within(desktop).getByRole("button", {
        name: opsCopy.hoy.cta.registerPayment,
      }),
    ).toBeEnabled();
    expect(
      within(desktop).getByRole("button", { name: opsCopy.hoy.cta.suspend }),
    ).toBeEnabled();
  });

  it("shows humanized subscription status in Plan when it is not a Señal echo", async () => {
    const user = userEvent.setup();
    mockUsePlatformPulse.mockReturnValue({
      data: {
        generatedAt: "2026-10-27T12:00:00.000Z",
        healthAsOf: null,
        kpis: {},
        attentionQueue: [
          {
            tenantId: "trial",
            name: "Prueba",
            subdomain: "prueba",
            lifecycleStage: "trialing",
            healthScore: 80,
            reasonCodes: ["trial_ending"],
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
    await user.click(
      screen.getByRole("tab", { name: new RegExp(opsCopy.hoy.chips.trial) }),
    );

    const planCell = within(hoyDesktop())
      .getByText("Prueba")
      .closest("tr")
      ?.querySelectorAll("td")[1];
    expect(planCell).toHaveTextContent(
      platformCopy.tenants.detail.subscription.statusLabels.trialing,
    );
    expect(planCell?.textContent).not.toMatch(/Trial por vencer/);
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

    const desktop = hoyDesktop();
    expect(
      within(desktop).queryByRole("button", {
        name: opsCopy.hoy.cta.registerPayment,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).queryByRole("button", {
        name: opsCopy.hoy.cta.suspend,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).queryByRole("button", { name: opsCopy.hoy.cta.resend }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).queryByRole("button", {
        name: opsCopy.hoy.cta.reactivate,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).getByRole("link", { name: opsCopy.hoy.view }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: new RegExp(opsCopy.hoy.chips.trial) }),
    );

    expect(
      within(hoyDesktop()).getByRole("link", {
        name: opsCopy.hoy.cta.viewHub,
      }),
    ).toBeInTheDocument();
    expect(
      within(hoyDesktop()).queryByRole("button", {
        name: opsCopy.hoy.cta.viewHub,
      }),
    ).not.toBeInTheDocument();
  });
});
