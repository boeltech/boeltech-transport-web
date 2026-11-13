/**
 * B1 gobierno Sin factura: política, diálogo Con→Sin, pestaña de bandeja,
 * sin Devolver, regularizar por rol y anular abono oculto al despachador.
 */
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TripStatus } from "@features/trips/domain/enums";
import type { Trip } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "@features/trips/presentation/copy/cfdiEmissionIntentCopy";
import {
  TripLiquidacionChip,
  type TripLiquidacionGovernance,
} from "@features/trips/presentation/components/TripLiquidacionChip";
import { TripDetailCostsTab } from "@features/trips/presentation/components/trip-costs/TripDetailCostsTab";
import { buildTripLiquidacionGovernance } from "@features/trips/presentation/utils/sinCfdiGovernance";
import { FiscalPolicySettingsPage } from "@features/settings/presentation/pages/FiscalPolicySettingsPage";
import { ApprovalRowSinCfdiException } from "@features/approvals/presentation/components/ApprovalRowSinCfdiException";
import { mapApprovalWorkbenchBuckets } from "@features/approvals/presentation/utils/mapApprovalWorkbenchBuckets";
import { approvalsCopy } from "@features/approvals/presentation/copy/approvalsCopy";
import type { ApprovableItem } from "@features/approvals/domain";
import {
  checkPermission,
  getPermissionsForRole,
} from "@shared/permissions";
import type { UserRole } from "@shared/constants/roles";

const smokeState = vi.hoisted(() => ({
  role: "admin" as "admin" | "dispatcher" | "accountant",
}));

vi.mock("@features/settings/infrastructure/fiscalPolicyApi", () => ({
  fiscalPolicyApi: {
    get: vi.fn().mockResolvedValue({
      tenantId: "t1",
      sinCfdiMode: "comercial_only_clients",
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    }),
    update: vi.fn(),
  },
}));

vi.mock("@shared/permissions", async () => {
  const actual = await vi.importActual<typeof import("@shared/permissions")>(
    "@shared/permissions",
  );
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: (module: string, action: string) =>
        actual
          .checkPermission(
            smokeState.role,
            actual.getPermissionsForRole(smokeState.role),
            module as never,
            action as never,
          )
          .allowed,
      role: smokeState.role,
      isLoading: false,
      isAuthenticated: true,
    }),
    useRole: () => smokeState.role,
  };
});

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    listOperationalCashReceipts: () =>
      Promise.resolve([
        {
          id: "r1",
          tripId: "trip-1",
          amount: 500,
          collectedAt: new Date("2026-11-01T12:00:00.000Z"),
          note: null,
          createdBy: "u1",
          createdAt: new Date("2026-11-01T12:00:00.000Z"),
          voidedAt: null,
          voidedBy: null,
          voidReason: null,
        },
      ]),
    createOperationalCashReceipt: vi.fn(),
    voidOperationalCashReceipt: vi.fn(),
  },
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  SelfApprovalConfirmDialog: () => null,
  OwnRequestChip: () => null,
  SelfApprovedBadge: () => null,
  showsSelfApprovedBadge: () => false,
  buildApprovalsInboxPath: () => "/finance/approvals",
  invalidateApprovalsRelatedQueries: vi.fn(),
  useSelfActionForbiddenHandler: () => () => null,
  useSelfActionResolver: () => () => "normal",
}));

vi.mock("@shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@shared/hooks")>(
    "@shared/hooks",
  );
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function dialogGovernance(
  changeKind: TripLiquidacionGovernance["changeKind"],
): TripLiquidacionGovernance {
  return {
    canOpenSinCfdi: true,
    changeKind,
    canRegularize: false,
    regularizeCashLocked: false,
    openRequest: null,
    canApprove: false,
    canCancel: false,
    approvalsHref: null,
  };
}

function roleAllows(role: UserRole, module: string, action: string): boolean {
  return checkPermission(
    role,
    getPermissionsForRole(role),
    module as never,
    action as never,
  ).allowed;
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    status: "in_progress",
    cfdiEmissionIntent: "sin_cfdi_efectivo",
    operationalOutcome: "standard",
    operationalCashCollectedAt: null,
    operationalCashAmount: null,
    operationalCash: null,
    invoicing: { hasActivePrincipalInvoice: false, invoiceStatus: null },
    client: { cfdiReceptorProfile: "receptor_cfdi" },
    costs: { baseRate: 1000 },
    ...overrides,
  } as Trip;
}

describe("gobierno Sin factura", () => {
  it("la política muestra los tres modos", async () => {
    render(
      <Providers>
        <FiscalPolicySettingsPage />
      </Providers>,
    );
    expect(
      await screen.findByRole("radio", { name: /No permitido/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Solo clientes Sin factura/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Permitido, con motivo/ }),
    ).toBeInTheDocument();
  });

  it("el diálogo con paso pide Solicitar Sin factura", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <TripLiquidacionChip
          trip={makeTrip({ cfdiEmissionIntent: "emitir_cfdi" })}
          governance={dialogGovernance("request")}
        />
      </Providers>,
    );
    await user.click(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.changeCta,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.requestSinCfdi,
      }),
    ).toBeInTheDocument();
  });

  it("el diálogo sin paso aplica con Usar Sin factura", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <TripLiquidacionChip
          trip={makeTrip({ cfdiEmissionIntent: "emitir_cfdi" })}
          governance={dialogGovernance("apply")}
        />
      </Providers>,
    );
    await user.click(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.changeCta,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.useSinCfdi,
      }),
    ).toBeInTheDocument();
  });

  it("la bandeja tiene la pestaña Sin factura y la fila no devuelve", async () => {
    const buckets = mapApprovalWorkbenchBuckets({
      activeType: "sin_cfdi_exception",
      counts: {
        trip_expense: 1,
        driver_advance_request: 0,
        internal_staff_compensation: 0,
        sin_cfdi_exception: 2,
      },
      onTypeChange: vi.fn(),
    });
    expect(buckets.map((bucket) => bucket.label)).toContain(
      approvalsCopy.inbox.tabs.sinCfdi,
    );

    const item = {
      approvableType: "sin_cfdi_exception",
      id: "req-1",
      amount: 1000,
      currency: "MXN",
      status: "pending",
      submittedAt: "2026-11-09T12:00:00.000Z",
      submittedBy: "u1",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      context: {
        approvableType: "sin_cfdi_exception",
        tripId: "trip-1",
        tripCode: "VJ-1",
        clientId: "c1",
        clientLegalName: "Cliente",
        baseRate: 1000,
        reason: "El cliente no puede timbrar este viaje.",
        requestedByName: "Ana",
      },
    } as ApprovableItem;

    render(
      <Providers>
        <table>
          <tbody>
            <ApprovalRowSinCfdiException
              item={item}
              selected={false}
              selectable
              onSelectChange={vi.fn()}
              canUpdate
              actionUi={{ kind: "act", selfConfirm: false }}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </Providers>,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: approvalsCopy.flow.menu.more }),
    );
    const menu = screen.getByRole("menu");
    expect(
      within(menu).queryByRole("menuitem", {
        name: approvalsCopy.flow.menu.return,
      }),
    ).not.toBeInTheDocument();
  });

  it("regularizar se ve con trips_settlement.update y no con el despachador", () => {
    const trip = makeTrip();
    const accountant = buildTripLiquidacionGovernance({
      trip,
      canRequest: false,
      canRegularize: roleAllows("accountant", "trips_settlement", "update"),
      canApprove: false,
      canCancel: false,
      canReadApprovals: false,
      mode: "allowed_with_override",
      requiresApproval: false,
    });
    const dispatcher = buildTripLiquidacionGovernance({
      trip,
      canRequest: roleAllows("dispatcher", "trips_settlement", "request"),
      canRegularize: roleAllows("dispatcher", "trips_settlement", "update"),
      canApprove: false,
      canCancel: false,
      canReadApprovals: false,
      mode: "allowed_with_override",
      requiresApproval: false,
    });
    expect(accountant?.canRegularize).toBe(true);
    expect(dispatcher?.canRegularize).toBe(false);

    render(
      <Providers>
        <TripLiquidacionChip trip={trip} governance={accountant} />
      </Providers>,
    );
    expect(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.regularizeCta,
      }),
    ).toBeInTheDocument();
  });

  it("el despachador registra abono y no ve Anular", async () => {
    smokeState.role = "dispatcher";
    render(
      <Providers>
        <TripDetailCostsTab
          tripId="trip-1"
          tripStatus={TripStatus.COMPLETED}
          baseRate={1000}
          cfdiDocumentIntent="ingreso"
          cfdiEmissionIntent="sin_cfdi_efectivo"
          operationalCashCollectedAt={null}
          operationalCashAmount={null}
          operationalCash={{
            status: "partial",
            collectedTotal: 500,
            pendingAmount: 500,
            baseRate: 1000,
            receiptCount: 1,
          }}
          stops={[]}
          expenses={[]}
          isLoading={false}
          isError={false}
          onRetry={() => undefined}
          canEditBaseRate={false}
          canCreateExpenses={false}
          canUpdatePendingExpenses={false}
          canDeletePendingExpenses={false}
          canApproveExpenses={false}
        />
      </Providers>,
    );
    expect(
      await screen.findByRole("button", { name: "Registrar abono" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Anular" }),
    ).not.toBeInTheDocument();
    smokeState.role = "admin";
  });
});
