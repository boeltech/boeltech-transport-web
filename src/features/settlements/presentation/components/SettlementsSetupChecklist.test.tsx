import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { HubReadinessItem } from "@shared/ui/page-shells";
import { SettlementsSetupChecklist } from "./SettlementsSetupChecklist";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.readiness;

const emptyItems: HubReadinessItem[] = [
  {
    id: "operators_salary",
    label: copy.operatorsSalaryLabel,
    value: 0,
    status: "empty",
    href: "/employees",
  },
  {
    id: "templates_active",
    label: copy.templatesActiveLabel,
    value: 0,
    status: "empty",
    href: "/finance/compensation/templates",
  },
];

describe("SettlementsSetupChecklist", () => {
  it("renders title and CTAs when not ready", () => {
    render(
      <MemoryRouter>
        <SettlementsSetupChecklist items={emptyItems} isReady={false} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("settlements-setup-checklist")).toBeInTheDocument();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.cta.operatorsSalary }),
    ).toHaveAttribute("href", "/employees");
    expect(
      screen.getByRole("link", { name: copy.cta.templatesActive }),
    ).toHaveAttribute("href", "/finance/compensation/templates");
  });

  it("collapses when ready", () => {
    const { container } = render(
      <MemoryRouter>
        <SettlementsSetupChecklist items={emptyItems} isReady />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("collapses while loading", () => {
    const { container } = render(
      <MemoryRouter>
        <SettlementsSetupChecklist
          items={emptyItems}
          isReady={false}
          isLoading
        />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
