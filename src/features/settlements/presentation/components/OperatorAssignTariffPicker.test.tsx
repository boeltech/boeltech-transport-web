import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { CompensationTemplate } from "@features/compensation/domain/entities";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application/compensationRoutes";
import { OperatorAssignTariffPicker } from "./OperatorAssignTariffPicker";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList.panel;

const {
  mockUseCompensationTemplates,
} = vi.hoisted(() => ({
  mockUseCompensationTemplates: vi.fn(),
}));

vi.mock("@features/compensation/application/hooks", () => ({
  useCompensationTemplates: (...args: unknown[]) =>
    mockUseCompensationTemplates(...args),
}));

function tpl(
  overrides: Partial<CompensationTemplate> &
    Pick<CompensationTemplate, "id" | "name" | "status">,
): CompensationTemplate {
  return {
    description: null,
    isActive: overrides.status === "active",
    version: 1,
    familyId: `fam-${overrides.id}`,
    lockedForEdit: false,
    rules: [],
    fixedAllowances: [],
    deductions: [],
    corridorIds: [],
    corridors: [],
    activeAssignmentsCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("OperatorAssignTariffPicker (D)", () => {
  it("lista solo status=active; omite draft e inactive", () => {
    mockUseCompensationTemplates.mockReturnValue({
      data: {
        data: [
          tpl({ id: "tpl-active", name: "Foránea activa", status: "active" }),
          tpl({ id: "tpl-draft", name: "Tarifa-01 borrador", status: "draft" }),
          tpl({ id: "tpl-inactive", name: "Vieja", status: "inactive" }),
        ],
      },
      isLoading: false,
      isError: false,
    });

    renderWithTheme(
      <OperatorAssignTariffPicker
        open
        onOpenChange={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("operators-pick-template-tpl-active")).toBeInTheDocument();
    expect(screen.getByText("Foránea activa")).toBeInTheDocument();
    expect(screen.queryByText("Tarifa-01 borrador")).not.toBeInTheDocument();
    expect(screen.queryByText("Vieja")).not.toBeInTheDocument();
  });

  it("si solo hay drafts: empty + Ir a Tarifas", () => {
    mockUseCompensationTemplates.mockReturnValue({
      data: {
        data: [
          tpl({ id: "tpl-draft", name: "Tarifa-01 borrador", status: "draft" }),
        ],
      },
      isLoading: false,
      isError: false,
    });

    renderWithTheme(
      <OperatorAssignTariffPicker
        open
        onOpenChange={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText(copy.pickTemplateEmpty)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: copy.goToTariffs });
    expect(link).toHaveAttribute("href", COMPENSATION_TEMPLATES_PATH);
  });
});
