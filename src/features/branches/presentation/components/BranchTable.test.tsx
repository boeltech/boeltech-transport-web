import { describe, expect, it, vi } from "vitest";
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

const sort = { field: "name", direction: "asc" as const };

function renderTable(ui: React.ReactElement) {
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

const tableProps = {
  isLoading: false as const,
  primaryTo: (branch: { id: string }) => `/branches/${branch.id}`,
  sort,
  onSortChange: vi.fn(),
};

describe("BranchTable", () => {
  it("renders location and principal badge", () => {
    renderTable(
      <BranchTable branches={[buildMainBranchListItem()]} {...tableProps} />,
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
        {...tableProps}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("link primario en nombre de sucursal", () => {
    const branch = buildBranchListItem({ name: "Fila navegable" });

    renderTable(<BranchTable branches={[branch]} {...tableProps} />);

    const link = screen.getByRole("link", { name: "Fila navegable" });
    expect(link).toHaveAttribute("href", `/branches/${branch.id}`);
  });

  it("retorna null cuando no hay filas", () => {
    const { container } = renderTable(
      <BranchTable branches={[]} {...tableProps} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
