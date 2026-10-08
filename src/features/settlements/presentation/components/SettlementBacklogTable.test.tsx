import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@shared/ui/tooltip";
import type {
  SettlementBacklogRow,
  SettlementBacklogRowType,
  SettlementPeriodOverlap,
  SettlementTemplateChange,
  SettlementTemplateSuperseded,
  TemplatePeriodAssignmentRef,
} from "../../domain/entities";
import {
  settlementDetailPath,
  settlementsPendingApprovalPath,
  settlementsRegistryPath,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  formatPeriodOverlapFolioLabel,
  resolveBacklogCreatePath,
  resolvePeriodOverlapTooltip,
  resolvePeriodOverlapWarningCopy,
} from "../utils/backlogPeriodOverlap";
import { SettlementBacklogTable } from "./SettlementBacklogTable";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

function makeOverlap(
  overrides: Partial<SettlementPeriodOverlap> = {},
): SettlementPeriodOverlap {
  return {
    settlementId: "stl-1",
    status: "draft",
    settlementNumber: "LIQ-2026-001",
    conflictsCount: 1,
    ...overrides,
  };
}

function makeRow(
  rowType: SettlementBacklogRowType,
  overrides: Partial<SettlementBacklogRow> = {},
): SettlementBacklogRow {
  return {
    employeeId: "emp-1",
    employeeFullName: "Xaime Weir Rojo",
    branchId: null,
    branchName: null,
    periodStart: "2026-08-17",
    periodEnd: "2026-08-23",
    pendingTripsCount: 3,
    oldestTripAgeDays: 5,
    estimatedNetAmount: 4523.14,
    rowType,
    warnings: [],
    periodOverlap: null,
    ...overrides,
  };
}

function renderTable(
  rows: readonly SettlementBacklogRow[],
  viewMode: "table" | "cards" = "table",
  onNavigateCreate = vi.fn(),
) {
  return render(
    <MemoryRouter>
      <TooltipProvider delayDuration={0}>
        <SettlementBacklogTable
          rows={rows}
          isLoading={false}
          viewMode={viewMode}
          onNavigateCreate={onNavigateCreate}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("SettlementBacklogTable period tooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it.each([
    ["trips_pending", settlementsCopy.workbench.backlog.periodTooltips.trips_pending],
    ["salary_close", settlementsCopy.workbench.backlog.periodTooltips.salary_close],
    ["mixed", settlementsCopy.workbench.backlog.periodTooltips.mixed],
  ] as const)("shows rowType-specific tooltip for %s", async (rowType, expectedText) => {
    const user = userEvent.setup();
    renderTable([makeRow(rowType)]);

    await user.hover(screen.getByText(/17 ago 2026/i));

    expect(
      await screen.findByRole("tooltip", { name: expectedText }),
    ).toBeInTheDocument();
  });
});

describe("SettlementBacklogTable density and warnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("does not repeat column headers as cell sub-labels in table mode (CA-1)", () => {
    renderTable([makeRow("trips_pending")]);

    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("rowgroup")[1];
    expect(body).toBeTruthy();

    // Headers appear once in thead; body must not echo field labels.
    expect(within(body!).queryByText(settlementsCopy.fields.estimatedAmount)).toBeNull();
    expect(within(body!).queryByText(settlementsCopy.fields.period)).toBeNull();
    expect(within(body!).queryByText(settlementsCopy.fields.pendingConcept)).toBeNull();
  });

  it("renders primary amount, concept badge, and Armar pago CTA (CA-2)", () => {
    renderTable([makeRow("trips_pending")]);

    expect(screen.getByText(/\$4,523\.14/)).toBeInTheDocument();
    expect(screen.getByText("3 viajes pendientes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: settlementsCopy.workbench.actions.settlePeriod,
      }),
    ).toBeInTheDocument();
  });

  it("hides no_client_invoice surface in table and cards (CA-3)", () => {
    const row = makeRow("trips_pending", {
      warnings: ["no_client_invoice", "period_overlap"],
    });

    const { unmount } = renderTable([row], "table");
    expect(screen.queryByText("Nota de factura")).toBeNull();
    expect(
      screen.queryByText(
        /El viaje aún no tiene factura al cliente/i,
      ),
    ).toBeNull();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();
    unmount();

    renderTable([row], "cards");
    expect(screen.queryByText("Nota de factura")).toBeNull();
    expect(
      screen.queryByText(
        /El viaje aún no tiene factura al cliente/i,
      ),
    ).toBeNull();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();
  });

  it("keeps period_overlap and open_advance badges visible (CA-4)", () => {
    renderTable([
      makeRow("mixed", {
        warnings: ["period_overlap", "open_advance", "no_client_invoice"],
      }),
    ]);

    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.open_advance),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nota de factura")).toBeNull();
  });

  it("navigates Armar pago with employee and period (CA-6)", async () => {
    const user = userEvent.setup();
    const onNavigateCreate = vi.fn();
    renderTable([makeRow("salary_close")], "table", onNavigateCreate);

    await user.click(
      screen.getByRole("button", {
        name: settlementsCopy.workbench.actions.settlePeriod,
      }),
    );

    expect(onNavigateCreate).toHaveBeenCalledWith(
      expect.stringMatching(/employeeId=emp-1/),
    );
    expect(onNavigateCreate).toHaveBeenCalledWith(
      expect.stringMatching(/periodStart=2026-08-17/),
    );
    expect(onNavigateCreate).toHaveBeenCalledWith(
      expect.stringMatching(/periodEnd=2026-08-23/),
    );
  });
});

describe("SettlementBacklogTable period_overlap soft CTA (F1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("shows one-line tooltip on period_overlap badge", async () => {
    const user = userEvent.setup();
    renderTable([
      makeRow("trips_pending", { warnings: ["period_overlap"] }),
    ]);

    const overlapLink = screen.getByRole("link", {
      name: settlementsCopy.workbench.warnings.period_overlap_cta,
    });
    await user.hover(overlapLink);

    expect(
      await screen.findByRole("tooltip", {
        name: settlementsCopy.workbench.warnings.period_overlap_tooltip,
      }),
    ).toBeInTheDocument();
  });

  it("links period_overlap badge to registry when periodOverlap is null (F1 fallback)", () => {
    renderTable([
      makeRow("trips_pending", {
        employeeId: "emp-42",
        warnings: ["period_overlap"],
        periodOverlap: null,
      }),
    ]);

    const overlapLink = screen.getByRole("link", {
      name: settlementsCopy.workbench.warnings.period_overlap_cta,
    });
    expect(overlapLink).toHaveAttribute(
      "href",
      settlementsRegistryPath({ employeeId: "emp-42" }),
    );
    expect(overlapLink.getAttribute("href")).toBe(
      "/finance/settlements/registry?employeeId=emp-42",
    );
  });

  it("keeps Armar pago enabled when period_overlap is present", () => {
    renderTable([
      makeRow("trips_pending", {
        warnings: ["period_overlap"],
        periodOverlap: makeOverlap(),
      }),
    ]);

    const settleButton = screen.getByRole("button", {
      name: settlementsCopy.workbench.actions.settlePeriod,
    });
    expect(settleButton).toBeEnabled();
  });

  it("leaves open_advance as plain badge without registry link or tooltip", async () => {
    const user = userEvent.setup();
    renderTable([
      makeRow("mixed", { warnings: ["open_advance"] }),
    ]);

    expect(
      screen.getByText(settlementsCopy.workbench.warnings.open_advance),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: settlementsCopy.workbench.warnings.period_overlap_cta,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", {
        name: settlementsCopy.workbench.warnings.open_advance,
      }),
    ).toBeNull();

    await user.hover(
      screen.getByText(settlementsCopy.workbench.warnings.open_advance),
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("SettlementBacklogTable period_overlap copy by status (F3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("uses generic F1 badge and tooltip when periodOverlap is null", async () => {
    const user = userEvent.setup();
    renderTable([
      makeRow("trips_pending", {
        warnings: ["period_overlap"],
        periodOverlap: null,
      }),
    ]);

    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();

    await user.hover(
      screen.getByRole("link", {
        name: settlementsCopy.workbench.warnings.period_overlap_cta,
      }),
    );
    expect(
      await screen.findByRole("tooltip", {
        name: settlementsCopy.workbench.warnings.period_overlap_tooltip,
      }),
    ).toBeInTheDocument();
  });

  it("uses in-progress badge and tooltip for pending_approval", async () => {
    const user = userEvent.setup();
    renderTable([
      makeRow("trips_pending", {
        warnings: ["period_overlap"],
        periodOverlap: makeOverlap({ status: "pending_approval", settlementNumber: null }),
      }),
    ]);

    expect(
      screen.getByText(
        settlementsCopy.workbench.warnings.period_overlap_in_progress,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeNull();

    await user.hover(
      screen.getByRole("link", {
        name: settlementsCopy.workbench.warnings.period_overlap_cta,
      }),
    );
    expect(
      await screen.findByRole("tooltip", {
        name: settlementsCopy.workbench.warnings
          .period_overlap_tooltip_in_progress,
      }),
    ).toBeInTheDocument();
  });

  it("uses disbursed badge and tooltip when status is disbursed", async () => {
    const user = userEvent.setup();
    renderTable([
      makeRow("trips_pending", {
        warnings: ["period_overlap"],
        periodOverlap: makeOverlap({ status: "disbursed", settlementNumber: null }),
      }),
    ]);

    expect(
      screen.getByText(
        settlementsCopy.workbench.warnings.period_overlap_disbursed,
      ),
    ).toBeInTheDocument();

    await user.hover(
      screen.getByRole("link", {
        name: settlementsCopy.workbench.warnings.period_overlap_cta,
      }),
    );
    expect(
      await screen.findByRole("tooltip", {
        name: settlementsCopy.workbench.warnings
          .period_overlap_tooltip_disbursed,
      }),
    ).toBeInTheDocument();
  });

  it("maps draft/approved to in-progress and null to generic via resolver", () => {
    const w = settlementsCopy.workbench.warnings;
    expect(resolvePeriodOverlapWarningCopy("draft")).toEqual({
      badge: w.period_overlap_in_progress,
      tooltip: w.period_overlap_tooltip_in_progress,
    });
    expect(resolvePeriodOverlapWarningCopy("approved")).toEqual({
      badge: w.period_overlap_in_progress,
      tooltip: w.period_overlap_tooltip_in_progress,
    });
    expect(resolvePeriodOverlapWarningCopy(null)).toEqual({
      badge: w.period_overlap,
      tooltip: w.period_overlap_tooltip,
    });
  });

  it("keeps Armar pago enabled and open_advance intact with disbursed overlap", () => {
    renderTable([
      makeRow("mixed", {
        warnings: ["period_overlap", "open_advance"],
        periodOverlap: makeOverlap({ status: "disbursed", settlementNumber: null }),
      }),
    ]);

    expect(
      screen.getByRole("button", {
        name: settlementsCopy.workbench.actions.settlePeriod,
      }),
    ).toBeEnabled();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.open_advance),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        settlementsCopy.workbench.warnings.period_overlap_disbursed,
      ),
    ).toBeInTheDocument();
  });
});

describe("SettlementBacklogTable period_overlap CTA (F2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("links to settlement detail when conflictsCount is 1", () => {
    renderTable([
      makeRow("trips_pending", {
        warnings: ["period_overlap"],
        periodOverlap: makeOverlap({
          settlementId: "stl-detail-9",
          conflictsCount: 1,
          status: "draft",
        }),
      }),
    ]);

    const overlapLink = screen.getByRole("link", {
      name: settlementsCopy.workbench.warnings.period_overlap_cta,
    });
    expect(overlapLink).toHaveAttribute(
      "href",
      settlementDetailPath("stl-detail-9"),
    );
  });

  it("links to pending-approval with driverId when conflictsCount > 1 and status pending_approval", () => {
    renderTable([
      makeRow("trips_pending", {
        employeeId: "emp-77",
        warnings: ["period_overlap"],
        periodOverlap: makeOverlap({
          settlementId: "stl-pa",
          conflictsCount: 3,
          status: "pending_approval",
        }),
      }),
    ]);

    const overlapLink = screen.getByRole("link", {
      name: settlementsCopy.workbench.warnings.period_overlap_cta,
    });
    expect(overlapLink).toHaveAttribute(
      "href",
      settlementsPendingApprovalPath({ driverId: "emp-77" }),
    );
    expect(overlapLink.getAttribute("href")).toBe(
      "/finance/settlements/pending-approval?driverId=emp-77",
    );
  });

  it("links to registry with employeeId when conflictsCount > 1 and status is not pending_approval", () => {
    renderTable([
      makeRow("trips_pending", {
        employeeId: "emp-55",
        warnings: ["period_overlap"],
        periodOverlap: makeOverlap({
          settlementId: "stl-reg",
          conflictsCount: 2,
          status: "approved",
        }),
      }),
    ]);

    const overlapLink = screen.getByRole("link", {
      name: settlementsCopy.workbench.warnings.period_overlap_cta,
    });
    expect(overlapLink).toHaveAttribute(
      "href",
      settlementsRegistryPath({ employeeId: "emp-55" }),
    );
  });
});

describe("SettlementBacklogTable ADR-0085 E11", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
  });

  it("badge con folio y estado; antigüedad solo en borrador o por autorizar", () => {
    const now = Date.parse("2026-08-25T12:00:00.000Z");
    expect(
      formatPeriodOverlapFolioLabel(
        makeOverlap({ createdAt: "2026-08-22T09:00:00.000Z" }),
        now,
      ),
    ).toBe("LIQ-2026-001 · Borrador · creado hace 3 días");
    expect(
      formatPeriodOverlapFolioLabel(
        makeOverlap({ status: "approved", createdAt: "2026-08-24T20:00:00.000Z" }),
        now,
      ),
    ).toBe("LIQ-2026-001 · Autorizado");
  });

  it("sin fecha de alta arma la etiqueta sin antigüedad; sin folio no arma", () => {
    expect(formatPeriodOverlapFolioLabel(makeOverlap())).toBe("LIQ-2026-001 · Borrador");
    expect(
      formatPeriodOverlapFolioLabel(makeOverlap({ settlementNumber: null })),
    ).toBeNull();
  });

  it("tooltip según tipo de cruce", () => {
    const contained = makeRow("trips_pending", {
      periodOverlap: makeOverlap({ overlapKind: "contained" }),
    });
    const partial = makeRow("salary_close", {
      periodOverlap: makeOverlap({ overlapKind: "partial" }),
      suggestedPeriodStart: "2026-08-20",
    });
    expect(resolvePeriodOverlapTooltip(contained)).toContain("ya está en LIQ-2026-001");
    expect(resolvePeriodOverlapTooltip(partial)).toMatch(/^Se cruza con LIQ-2026-001\. Armar pago empezará el /);
  });

  it("solape parcial: armar arranca en la fecha sugerida", () => {
    const row = makeRow("salary_close", {
      warnings: ["period_overlap"],
      periodOverlap: makeOverlap({ overlapKind: "partial" }),
      suggestedPeriodStart: "2026-08-20",
    });
    expect(resolveBacklogCreatePath(row)).toContain("periodStart=2026-08-20");
    expect(resolveBacklogCreatePath(row)).toContain("periodEnd=2026-08-23");
  });

  it("solape contenido o fecha sugerida fuera del período: conserva el inicio de la fila", () => {
    const contained = makeRow("trips_pending", {
      periodOverlap: makeOverlap({ overlapKind: "contained" }),
      suggestedPeriodStart: "2026-08-20",
    });
    const outOfRange = makeRow("salary_close", {
      periodOverlap: makeOverlap({ overlapKind: "partial" }),
      suggestedPeriodStart: "2026-08-30",
    });
    expect(resolveBacklogCreatePath(contained)).toContain("periodStart=2026-08-17");
    expect(resolveBacklogCreatePath(outOfRange)).toContain("periodStart=2026-08-17");
  });

  it("el botón de armar usa la fecha sugerida", async () => {
    const user = userEvent.setup();
    const onNavigateCreate = vi.fn();
    renderTable(
      [
        makeRow("salary_close", {
          warnings: ["period_overlap"],
          periodOverlap: makeOverlap({ overlapKind: "partial" }),
          suggestedPeriodStart: "2026-08-20",
        }),
      ],
      "table",
      onNavigateCreate,
    );

    await user.click(screen.getByRole("button", { name: settlementsCopy.workbench.actions.settlePeriod }));
    expect(onNavigateCreate).toHaveBeenCalledWith(expect.stringContaining("periodStart=2026-08-20"));
  });
});

describe("SettlementBacklogTable reimbursement_only (E11-F3)", () => {
  const reimbursementCopy = settlementsCopy.reimbursements;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  function reimbursementRow(overrides: Partial<SettlementBacklogRow> = {}) {
    return makeRow("reimbursement_only", {
      periodStart: "2026-10-05",
      periodEnd: "2026-10-05",
      pendingTripsCount: 0,
      estimatedNetAmount: 850,
      ...overrides,
    });
  }

  it("muestra «Solo reembolsos», período «No aplica» y el CTA de pago de reembolsos", async () => {
    const user = userEvent.setup();
    const onNavigateCreate = vi.fn();
    renderTable([reimbursementRow()], "table", onNavigateCreate);

    expect(screen.getByText(reimbursementCopy.backlog.rowType)).toBeInTheDocument();
    expect(screen.getByText(reimbursementCopy.backlog.periodNotApplicable)).toBeInTheDocument();
    expect(screen.queryByText(/5 oct 2026/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: settlementsCopy.workbench.actions.settlePeriod }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: reimbursementCopy.createAction }));
    const target = String(onNavigateCreate.mock.calls[0][0]);
    expect(target).toContain("kind=reimbursements");
    expect(target).toContain("employeeId=emp-1");
    expect(target).not.toContain("periodStart");
  });

  it("tooltip del período explica que no lleva período", async () => {
    const user = userEvent.setup();
    renderTable([reimbursementRow()]);
    await user.hover(screen.getByText(reimbursementCopy.backlog.periodNotApplicable));
    expect(
      await screen.findByRole("tooltip", { name: reimbursementCopy.backlog.periodTooltip }),
    ).toBeInTheDocument();
  });

  it("muestra la insignia de beneficiario con el conteo", () => {
    renderTable([
      reimbursementRow({
        warnings: ["reimbursement_payee_required"],
        reimbursementsRequiringPayeeCount: 2,
      }),
    ]);
    expect(screen.getByTestId("backlog-payee-required-badge")).toHaveTextContent(
      reimbursementCopy.backlog.payeeRequiredBadge(2),
    );
  });

  it("los tardíos no muestran insignia propia", () => {
    renderTable([
      makeRow("trips_pending", { warnings: ["late_reimbursement"], lateReimbursementsCount: 1 }),
    ]);
    expect(screen.queryByTestId("backlog-payee-required-badge")).not.toBeInTheDocument();
    expect(screen.queryByText(/tard/i)).not.toBeInTheDocument();
  });

  it("resolveBacklogCreatePath lleva al alta de reembolsos sin período", () => {
    const path = resolveBacklogCreatePath(reimbursementRow());
    expect(path).toContain("kind=reimbursements");
    expect(path).not.toContain("periodEnd");
  });
});

describe("SettlementBacklogTable — cambio de esquema en el período (D-1 C1)", () => {
  const BADGE = "Cambio de esquema en el período";

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  function ref(
    templateId: string,
    templateName: string,
    effectiveFrom: string,
    effectiveTo: string | null,
    overrides: Partial<TemplatePeriodAssignmentRef> = {},
  ): TemplatePeriodAssignmentRef {
    return {
      assignmentId: `asg-${templateId}`,
      templateId,
      templateName,
      templateVersion: 1,
      effectiveFrom,
      effectiveTo,
      isClosing: false,
      ...overrides,
    };
  }

  function change(
    assignments: TemplatePeriodAssignmentRef[],
    from: TemplatePeriodAssignmentRef,
    templatesCount = new Set(assignments.map((a) => a.templateId)).size,
  ): SettlementTemplateChange {
    const to = { ...assignments[assignments.length - 1]!, isClosing: true };
    return { templatesCount, from, to, assignments: [...assignments.slice(0, -1), to] };
  }

  const norte = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-14");
  const sur = ref("tpl-sur", "Sur", "2026-08-15", null);
  const twoSchemes = change([norte, sur], norte);

  const norteOpen = ref("tpl-norte", "Norte", "2026-07-01", null);
  const concurrentOpen = change([norteOpen, sur], norteOpen);
  const norteOverlapping = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-20");
  const concurrentOverlap = change([norteOverlapping, sur], norteOverlapping);

  const norteShort = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-09");
  const centro = ref("tpl-centro", "Centro", "2026-08-10", "2026-08-19");
  const surLate = ref("tpl-sur", "Sur", "2026-08-20", null);
  const severalSchemes = change([norteShort, centro, surLate], centro);

  function rowWith(
    templateChange: SettlementTemplateChange | null,
    withTrips: boolean,
    overrides: Partial<SettlementBacklogRow> = {},
  ): SettlementBacklogRow {
    return makeRow(withTrips ? "trips_pending" : "salary_close", {
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      pendingTripsCount: withTrips ? 2 : 0,
      warnings: ["template_change_in_period"],
      templateChange,
      ...overrides,
    });
  }

  it.each([
    [
      "dos esquemas · sin viajes",
      twoSchemes,
      false,
      "En este período el operador tuvo dos esquemas: Norte hasta el 14 ago 2026 y Sur desde el 15 ago 2026. El pago se calcula completo con Sur, el vigente al cierre. Si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
    [
      "dos esquemas · con viajes",
      twoSchemes,
      true,
      "En este período el operador tuvo dos esquemas: Norte hasta el 14 ago 2026 y Sur desde el 15 ago 2026. Todos los viajes y conceptos del período se calculan con Sur, el vigente al cierre. Si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
    [
      "varios esquemas · sin viajes",
      severalSchemes,
      false,
      "En este período el operador tuvo 3 esquemas, de Norte a Sur. El pago se calcula completo con Sur, el vigente al cierre. Si debe reflejar la parte de los demás esquemas, agrega un ajuste manual.",
    ],
    [
      "varios esquemas · con viajes",
      severalSchemes,
      true,
      "En este período el operador tuvo 3 esquemas, de Norte a Sur. Todos los viajes y conceptos del período se calculan con Sur, el vigente al cierre. Si debe reflejar la parte de los demás esquemas, agrega un ajuste manual.",
    ],
    [
      "a la vez (anterior abierta) · sin viajes",
      concurrentOpen,
      false,
      "En este período el operador tuvo dos esquemas a la vez: Norte y Sur. El pago se calcula completo con Sur, el más reciente por vigencia. Revisa sus vigencias en Esquemas de compensación; si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
    [
      "a la vez (anterior traslapada) · con viajes",
      concurrentOverlap,
      true,
      "En este período el operador tuvo dos esquemas a la vez: Norte y Sur. Todos los viajes y conceptos del período se calculan con Sur, el más reciente por vigencia. Revisa sus vigencias en Esquemas de compensación; si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
  ] as const)("%s: insignia y tooltip de la variante", async (_label, tc, withTrips, expected) => {
    const user = userEvent.setup();
    renderTable([rowWith(tc, withTrips)]);

    const badge = screen.getByTestId("backlog-template-change-badge");
    expect(badge).toHaveTextContent(BADGE);
    await user.hover(badge);

    expect(await screen.findByRole("tooltip", { name: expected })).toBeInTheDocument();
  });

  it("agrega la versión cuando los dos esquemas mostrados se llaman igual", async () => {
    const user = userEvent.setup();
    const v1 = ref("tpl-a1", "Operador estándar", "2026-07-01", "2026-08-14");
    const v2 = ref("tpl-a2", "Operador estándar", "2026-08-15", null, { templateVersion: 2 });
    renderTable([rowWith(change([v1, v2], v1), false)]);

    await user.hover(screen.getByTestId("backlog-template-change-badge"));

    expect(
      await screen.findByRole("tooltip", {
        name: "En este período el operador tuvo dos esquemas: Operador estándar (v1) hasta el 14 ago 2026 y Operador estándar (v2) desde el 15 ago 2026. El pago se calcula completo con Operador estándar (v2), el vigente al cierre. Si debe reflejar la parte de Operador estándar (v1), agrega un ajuste manual.",
      }),
    ).toBeInTheDocument();
  });

  it("no agrega versión si el nombre repetido no aparece en el texto", async () => {
    const user = userEvent.setup();
    const middle = ref("tpl-sur-v1", "Sur", "2026-08-10", "2026-08-19");
    const closing = ref("tpl-sur-v2", "Sur", "2026-08-20", null, { templateVersion: 2 });
    renderTable([rowWith(change([norteShort, middle, closing], middle), false)]);

    await user.hover(screen.getByTestId("backlog-template-change-badge"));

    expect(
      await screen.findByRole("tooltip", {
        name: "En este período el operador tuvo 3 esquemas, de Norte a Sur. El pago se calcula completo con Sur, el vigente al cierre. Si debe reflejar la parte de los demás esquemas, agrega un ajuste manual.",
      }),
    ).toBeInTheDocument();
  });

  it("código sin templateChange: insignia sin tooltip", async () => {
    const user = userEvent.setup();
    renderTable([rowWith(null, true)]);

    const badge = screen.getByTestId("backlog-template-change-badge");
    expect(badge).toHaveTextContent(BADGE);
    await user.hover(badge);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("se ordena después del folio de solape y antes del anticipo", () => {
    renderTable([
      rowWith(twoSchemes, true, {
        warnings: ["open_advance", "template_change_in_period", "period_overlap"],
      }),
    ]);

    const list = screen.getByTestId("backlog-template-change-badge").closest("ul")!;
    const items = within(list).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual([
      settlementsCopy.workbench.warnings.period_overlap,
      BADGE,
      settlementsCopy.workbench.warnings.open_advance,
    ]);
  });

  it("también aparece en la vista de tarjetas", () => {
    renderTable([rowWith(twoSchemes, true)], "cards");
    expect(screen.getByTestId("backlog-template-change-badge")).toHaveTextContent(BADGE);
  });

  it("un código sin copy no se pinta", () => {
    renderTable([
      makeRow("trips_pending", {
        warnings: ["brand_new_code", "open_advance"] as unknown as SettlementBacklogRow["warnings"],
      }),
    ]);

    expect(screen.queryByText("brand_new_code")).not.toBeInTheDocument();
    expect(screen.getByText(settlementsCopy.workbench.warnings.open_advance)).toBeInTheDocument();
  });

  it("si solo llegan códigos sin copy no queda lista vacía", () => {
    renderTable([
      makeRow("trips_pending", {
        warnings: ["brand_new_code"] as unknown as SettlementBacklogRow["warnings"],
      }),
    ]);

    expect(screen.queryByText("brand_new_code")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("SettlementBacklogTable — versión de tarifa reemplazada (api#59)", () => {
  const BADGE = "Versión de tarifa reemplazada";

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  const superseded: SettlementTemplateSuperseded = {
    templateId: "tpl-v1",
    templateName: "Operador estándar",
    templateVersion: 1,
    assignmentId: "asg-1",
    supersededAt: "2026-10-03T16:00:00Z",
    replacedBy: { templateId: "tpl-v2", templateName: "Operador estándar", templateVersion: 2 },
  };

  function rowWith(
    templateSuperseded: SettlementTemplateSuperseded | null | undefined,
    overrides: Partial<SettlementBacklogRow> = {},
  ): SettlementBacklogRow {
    return makeRow("salary_close", {
      periodStart: "2026-09-16",
      periodEnd: "2026-09-30",
      pendingTripsCount: 0,
      warnings: ["template_version_superseded"],
      templateSuperseded,
      ...overrides,
    });
  }

  it.each([
    [
      "con la versión que la reemplazó",
      superseded,
      "Se calcula con Operador estándar versión 1, que ya fue reemplazada por la versión 2. Si el operador debe cobrar con la versión 2, reasígnalo indicando desde qué fecha.",
    ],
    [
      "sin versión activa (replacedBy null)",
      { ...superseded, replacedBy: null },
      "Se calcula con Operador estándar versión 1, que ya fue reemplazada. Si el operador debe cobrar con otra versión, reasígnalo indicando desde qué fecha.",
    ],
  ] as const)("%s: insignia y tooltip", async (_label, value, expected) => {
    const user = userEvent.setup();
    renderTable([rowWith(value)]);

    const badge = screen.getByTestId("backlog-template-superseded-badge");
    expect(badge).toHaveTextContent(BADGE);
    await user.hover(badge);

    expect(await screen.findByRole("tooltip", { name: expected })).toBeInTheDocument();
  });

  it.each([
    ["null", null],
    ["ausente (API anterior)", undefined],
  ])("código con templateSuperseded %s: insignia sin tooltip", async (_label, value) => {
    const user = userEvent.setup();
    renderTable([rowWith(value)]);

    const badge = screen.getByTestId("backlog-template-superseded-badge");
    expect(badge).toHaveTextContent(BADGE);
    await user.hover(badge);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sin el código no hay insignia aunque llegue el objeto", () => {
    renderTable([rowWith(superseded, { warnings: [] })]);
    expect(screen.queryByTestId("backlog-template-superseded-badge")).not.toBeInTheDocument();
  });

  it("se ordena después del cambio de esquema y antes del anticipo", () => {
    renderTable([
      rowWith(superseded, {
        warnings: [
          "open_advance",
          "template_version_superseded",
          "template_change_in_period",
          "period_overlap",
        ],
      }),
    ]);

    const list = screen.getByTestId("backlog-template-superseded-badge").closest("ul")!;
    const items = within(list).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual([
      settlementsCopy.workbench.warnings.period_overlap,
      settlementsCopy.workbench.warnings.template_change_in_period,
      BADGE,
      settlementsCopy.workbench.warnings.open_advance,
    ]);
  });

  it("también aparece en la vista de tarjetas y nunca el código crudo", () => {
    renderTable([rowWith(superseded)], "cards");
    expect(screen.getByTestId("backlog-template-superseded-badge")).toHaveTextContent(BADGE);
    expect(screen.queryByText("template_version_superseded")).not.toBeInTheDocument();
  });
});