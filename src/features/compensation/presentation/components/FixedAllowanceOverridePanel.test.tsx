import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TemplateAssignment, TemplateFixedAllowance } from "../../domain/entities";
import { FixedAllowanceOverridePanel } from "./FixedAllowanceOverridePanel";

const mockUpsert = vi.fn();
const mockToast = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@features/employees/application", () => ({
  useEmployeeBasic: () => ({ data: { salaryType: "weekly" } }),
}));

vi.mock("@features/settlements/application", () => ({
  PeriodStepper: ({
    periodStart,
    periodEnd,
  }: {
    periodStart: string;
    periodEnd: string;
  }) => (
    <div data-testid="period-stepper">
      {periodStart}–{periodEnd}
    </div>
  ),
  buildSuggestedSettlementPeriod: () => ({
    periodStart: "2026-11-09",
    periodEnd: "2026-11-15",
  }),
}));

vi.mock("../../application/hooks", () => ({
  useFixedAllowanceOverrides: () => ({
    data: [{ allowanceId: "all-1", isSuspended: true }],
    isLoading: false,
  }),
  useUpsertFixedAllowanceOverride: () => ({
    mutateAsync: mockUpsert,
    isPending: false,
  }),
}));

const assignment: TemplateAssignment = {
  id: "assign-1",
  employeeId: "emp-1",
  employeeFullName: "Adriana Juarez",
  templateId: "tpl-1",
  templateName: "Foráneo",
  effectiveFrom: "2026-08-01",
  effectiveTo: null,
  isActive: true,
  assignedBy: null,
  reason: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const allowances: TemplateFixedAllowance[] = [
  {
    id: "all-1",
    allowanceType: "meals",
    label: "Comidas",
    amount: 500,
    period: "weekly",
    isMandatory: false,
  },
];

describe("FixedAllowanceOverridePanel (D3–D4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ allowanceId: "all-1", isSuspended: false });
  });

  it("D4: switch «incluido» apagado cuando está suspendida; al encender resume", async () => {
    const user = userEvent.setup();
    render(
      <FixedAllowanceOverridePanel
        assignment={assignment}
        fixedAllowances={allowances}
        paymentPeriodStart="2026-11-09"
        paymentPeriodEnd="2026-11-15"
      />,
    );

    const toggle = screen.getByRole("switch", { name: /se incluye en el pago/i });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          allowanceId: "all-1",
          isSuspended: false,
        }),
      );
    });
  });
});
