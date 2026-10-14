import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriverForm } from "./DriverForm";
import { driversCopy } from "../copy/driversCopy";

vi.mock("@features/employees", () => ({
  useEmployeeBasic: () => ({ data: undefined }),
  useAvailableEmployeesForDriver: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

const fc = driversCopy.form;

function renderReviewStep() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DriverForm
          mode="create"
          wizardMode
          wizardStepIndex={3}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DriverForm create review F3 (D14)", () => {
  it("labels de grupos en sentence case (sin uppercase / tracking-wide)", () => {
    renderReviewStep();

    const reviewPanel = document.querySelector(
      '[data-wizard-panel="3"]',
    ) as HTMLElement;
    expect(reviewPanel).toBeTruthy();

    for (const label of [
      fc.section.review.groupEmployee,
      fc.section.review.groupLicenseMedical,
      fc.section.review.groupExamsDevice,
    ]) {
      const group = Array.from(
        reviewPanel.querySelectorAll("p.text-xs.font-semibold"),
      ).find((p) => p.textContent === label);
      expect(group, `grupo «${label}»`).toBeTruthy();
      expect(group!.className).not.toMatch(/\buppercase\b/);
      expect(group!.className).not.toMatch(/\btracking-wide\b/);
      expect(group!.className).toMatch(/\btext-muted-foreground\b/);
    }
  });
});
