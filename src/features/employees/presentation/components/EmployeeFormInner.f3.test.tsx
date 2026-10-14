import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { EmployeeFormInner } from "./EmployeeFormInner";
import { employeesCopy } from "../copy/employeesCopy";

vi.mock("../../application/hooks/useEmployees", () => ({
  useCreateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  employeeQueryKeys: { detail: (id: string) => ["employees", id] },
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [], meta: undefined } }),
}));

vi.mock("@shared/ui/address-input", () => ({
  AddressInput: () => <div data-testid="address-input-stub" />,
  EntityAddressForm: () => null,
  buildGeocodingEntityFormSection: () => null,
  setFormCoordinates: vi.fn(),
}));

const fc = employeesCopy.form;

function renderReviewStep() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TooltipProvider>
          <EmployeeFormInner
            isEditing={false}
            embeddedInWizardShell
            wizardStepIndex={4}
          />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EmployeeFormInner create review F3 (D14)", () => {
  it("labels del review en sentence case (sin uppercase / tracking-wide)", () => {
    const { container } = renderReviewStep();

    expect(screen.getByText(fc.section.review.title)).toBeInTheDocument();

    for (const text of [
      fc.label.reviewName,
      fc.label.reviewHire,
      fc.label.reviewEmail,
      fc.label.reviewAddress,
    ]) {
      const node = screen.getByText(text);
      expect(node.className).not.toMatch(/\buppercase\b/);
      expect(node.className).not.toMatch(/\btracking-wide\b/);
      expect(node.className).toMatch(/\btext-muted-foreground\b/);
    }

    const eyebrows = container.querySelectorAll("p.text-sm.text-muted-foreground");
    expect(eyebrows.length).toBeGreaterThanOrEqual(4);
  });
});
