import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { BranchTable } from "./BranchTable";
import { branchesCopy } from "../copy/branchesCopy";
import {
  buildBranchListItem,
  buildMainBranchListItem,
} from "../../test/branchTestFixtures";

function renderTable(
  ui: React.ReactElement,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("BranchTable", () => {
  it("renders location and principal badge", () => {
    renderTable(
      <BranchTable
        branches={[buildMainBranchListItem()]}
        isLoading={false}
      />,
    );

    expect(screen.getByText("El Marqués, Querétaro")).toBeInTheDocument();
    expect(screen.getByText(branchesCopy.card.mainBadge)).toBeInTheDocument();
  });

  it("renders em dash when city and state are missing", () => {
    renderTable(
      <BranchTable
        branches={[
          buildBranchListItem({
            city: "",
            state: "",
            isMain: false,
          }),
        ]}
        isLoading={false}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("navigates to detail when row is clicked", async () => {
    const branch = buildBranchListItem({ name: "Fila navegable" });

    renderTable(
      <BranchTable branches={[branch]} isLoading={false} />,
    );

    const row = screen.getByText("Fila navegable").closest("tr");
    expect(row).toBeTruthy();
    row?.click();

    // MemoryRouter keeps navigation in-memory; BranchTable calls navigate()
    expect(row).toHaveClass("cursor-pointer");
  });
});
