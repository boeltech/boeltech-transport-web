import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { formatDate } from "@shared/utils/dateUtils";
import type { PlatformTenantEntitlements } from "../../domain/entities";
import { OpsTenantModulesPanel } from "./OpsTenantModulesPanel";
import { opsCopy } from "./opsCopy";

const getTenantEntitlements = vi.fn();
const previewTenantEntitlement = vi.fn();
const mutateTenantEntitlement = vi.fn();
const toast = vi.fn();

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getTenantEntitlements: (...args: unknown[]) =>
      getTenantEntitlements(...args),
    previewTenantEntitlement: (...args: unknown[]) =>
      previewTenantEntitlement(...args),
    mutateTenantEntitlement: (...args: unknown[]) =>
      mutateTenantEntitlement(...args),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast }) };
});

const copy = opsCopy.hub.modules;
const TENANT_ID = "t1";
const ACTIVATED_AT = "2026-07-01T12:00:00.000Z";

function entitlements(
  overrides: Partial<PlatformTenantEntitlements> = {},
): PlatformTenantEntitlements {
  return {
    directEntitlements: [
      {
        moduleCode: "gps_tracking",
        moduleName: "Rastreo GPS",
        kind: "addon",
        status: "active",
        activatedAt: ACTIVATED_AT,
        priceLockedCents: 5900,
        priceTier: "ea",
        memberCodes: [],
      },
      {
        moduleCode: "pack_finanzas",
        moduleName: "Pack Finanzas",
        kind: "pack",
        status: "active",
        activatedAt: ACTIVATED_AT,
        priceLockedCents: 19900,
        priceTier: "ga",
        memberCodes: ["liquidaciones", "codigo_sin_nombre"],
      },
    ],
    effectiveModuleCodes: ["gps_tracking", "pack_finanzas", "liquidaciones"],
    profitabilityLevel: "L1",
    catalog: [
      {
        code: "gps_tracking",
        name: "Rastreo GPS",
        kind: "addon",
        isActiveForTenant: true,
        memberCodes: [],
        priceEaCents: 5900,
        priceGaCents: 7900,
        maturity: "ea",
      },
      {
        code: "pack_finanzas",
        name: "Pack Finanzas",
        kind: "pack",
        isActiveForTenant: true,
        memberCodes: ["liquidaciones"],
        priceEaCents: null,
        priceGaCents: 19900,
        maturity: "ga",
      },
      {
        code: "liquidaciones",
        name: "Liquidaciones",
        kind: "addon",
        isActiveForTenant: true,
        memberCodes: [],
        priceEaCents: null,
        priceGaCents: 9900,
        maturity: "ga",
      },
    ],
    commercialSummary: {
      planMonthlyPriceCents: 446600,
      modulesTotalCents: 25800,
      overageTotalCents: 0,
      subtotalCents: 472400,
      ivaCents: 75584,
      estimatedTotalCents: 547984,
      currency: "MXN",
      periodKey: "2026-07",
      billingCycle: "monthly",
    },
    ...overrides,
  };
}

function cancelPreview(modulesLost: string[]) {
  return {
    current: {
      moduleCode: "gps_tracking",
      status: "active",
      effectiveModuleCodes: [],
    },
    target: {
      moduleCode: "gps_tracking",
      action: "cancel",
      status: "inactive",
      effectiveModuleCodes: [],
    },
    modulesGained: [],
    modulesLost,
    capacityDelta: {},
    priceEstimate: {
      currency: "MXN",
      estimatedMonthlyCents: null,
      estimateAvailable: false,
    },
    effectiveAt: "2026-07-02T12:00:00.000Z",
    warnings: [],
  };
}

function renderPanel(canMutate = true, onAddAddon = vi.fn()) {
  renderWithTheme(
    <OpsTenantModulesPanel
      tenantId={TENANT_ID}
      canMutate={canMutate}
      onAddAddon={onAddAddon}
    />,
  );
  return { onAddAddon };
}

describe("OpsTenantModulesPanel", () => {
  beforeEach(() => {
    getTenantEntitlements.mockReset();
    previewTenantEntitlement.mockReset();
    mutateTenantEntitlement.mockReset();
    toast.mockReset();
  });

  it("lists direct add-ons with kind, tier, date, locked price, members and total", async () => {
    getTenantEntitlements.mockResolvedValue(entitlements());
    renderPanel();

    const gpsRow = await screen.findByTestId("ops-tenant-module-gps_tracking");
    expect(within(gpsRow).getByText("Rastreo GPS")).toBeInTheDocument();
    expect(within(gpsRow).getByText("gps_tracking")).toBeInTheDocument();
    expect(within(gpsRow).getByText(copy.kindLabels.addon)).toBeInTheDocument();
    expect(within(gpsRow).getByText(copy.tierLabels.ea)).toBeInTheDocument();
    expect(
      within(gpsRow).getByText(formatDate(ACTIVATED_AT)),
    ).toBeInTheDocument();
    expect(within(gpsRow).getByText("59.00")).toBeInTheDocument();

    const packRow = screen.getByTestId("ops-tenant-module-pack_finanzas");
    expect(within(packRow).getByText(copy.kindLabels.pack)).toBeInTheDocument();
    expect(within(packRow).getByText(copy.tierLabels.ga)).toBeInTheDocument();
    expect(
      within(packRow).getByText(
        `pack_finanzas · ${copy.includes("Liquidaciones, codigo_sin_nombre")}`,
      ),
    ).toBeInTheDocument();

    expect(
      within(screen.getByTestId("ops-tenant-modules-total")).getByText(
        "258.00",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.profitabilityLevel)).toBeInTheDocument();
    expect(getTenantEntitlements).toHaveBeenCalledWith(TENANT_ID);
  });

  it("shows the empty state with the add CTA for the owner", async () => {
    const user = userEvent.setup();
    getTenantEntitlements.mockResolvedValue(
      entitlements({ directEntitlements: [] }),
    );
    const { onAddAddon } = renderPanel();

    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.add }));
    expect(onAddAddon).toHaveBeenCalledTimes(1);
  });

  it("tolerates a retired module (name equals code, not in catalog)", async () => {
    getTenantEntitlements.mockResolvedValue(
      entitlements({
        directEntitlements: [
          {
            moduleCode: "internal_staff_compensation",
            moduleName: "internal_staff_compensation",
            kind: "addon",
            status: "active",
            activatedAt: ACTIVATED_AT,
            priceLockedCents: 4900,
            priceTier: "ga",
            memberCodes: [],
          },
        ],
      }),
    );
    renderPanel();

    const row = await screen.findByTestId(
      "ops-tenant-module-internal_staff_compensation",
    );
    expect(within(row).getByText(copy.retired)).toBeInTheDocument();
    expect(
      within(row).getByRole("button", {
        name: copy.removeAria("internal_staff_compensation"),
      }),
    ).toBeInTheDocument();
  });

  it("removes an add-on after a successful cancel preview", async () => {
    const user = userEvent.setup();
    getTenantEntitlements.mockResolvedValue(entitlements());
    previewTenantEntitlement.mockResolvedValue(
      cancelPreview(["gps_tracking"]),
    );
    mutateTenantEntitlement.mockResolvedValue(
      entitlements({ directEntitlements: [] }),
    );
    renderPanel();

    await user.click(
      await screen.findByRole("button", {
        name: copy.removeAria("Rastreo GPS"),
      }),
    );

    const dialog = await screen.findByTestId("ops-remove-addon-dialog");
    await waitFor(() => {
      expect(previewTenantEntitlement).toHaveBeenCalledWith(TENANT_ID, {
        moduleCode: "gps_tracking",
        action: "cancel",
      });
    });
    expect(
      await within(dialog).findByTestId("ops-remove-addon-preview"),
    ).toHaveTextContent("Rastreo GPS");

    await user.click(
      within(dialog).getByRole("button", { name: copy.removeDialog.confirm }),
    );

    await waitFor(() => {
      expect(mutateTenantEntitlement).toHaveBeenCalledWith(TENANT_ID, {
        moduleCode: "gps_tracking",
        action: "deactivate",
      });
    });
    expect(toast).toHaveBeenCalledWith({
      title: copy.removeDialog.success("Rastreo GPS"),
      variant: "success",
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("ops-remove-addon-dialog"),
      ).not.toBeInTheDocument();
    });
  });

  it("still allows removing when the cancel preview fails", async () => {
    const user = userEvent.setup();
    getTenantEntitlements.mockResolvedValue(entitlements());
    previewTenantEntitlement.mockRejectedValue(new Error("MODULE_UNKNOWN"));
    mutateTenantEntitlement.mockResolvedValue(entitlements());
    renderPanel();

    await user.click(
      await screen.findByRole("button", {
        name: copy.removeAria("Rastreo GPS"),
      }),
    );

    const dialog = await screen.findByTestId("ops-remove-addon-dialog");
    expect(
      await within(dialog).findByText(copy.removeDialog.previewFailedTitle),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", {
      name: copy.removeDialog.confirm,
    });
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => {
      expect(mutateTenantEntitlement).toHaveBeenCalledWith(TENANT_ID, {
        moduleCode: "gps_tracking",
        action: "deactivate",
      });
    });
  });

  it("support sees the list without add or remove actions", async () => {
    getTenantEntitlements.mockResolvedValue(entitlements());
    renderPanel(false);

    expect(
      await screen.findByTestId("ops-tenant-module-gps_tracking"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.removeAria("Rastreo GPS") }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.add }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.columns.actions)).not.toBeInTheDocument();
  });
});
