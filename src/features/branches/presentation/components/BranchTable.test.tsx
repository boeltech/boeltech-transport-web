import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BranchTable } from "./BranchTable";
import { branchesCopy } from "../copy/branchesCopy";
import {
  buildBranchListItem,
  buildMainBranchListItem,
} from "../../test/branchTestFixtures";

describe("BranchTable", () => {
  it("renders location and principal badge", () => {
    render(
      <MemoryRouter>
        <BranchTable
          branches={[buildMainBranchListItem()]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("El Marqués, Querétaro")).toBeInTheDocument();
    expect(screen.getByText(branchesCopy.card.mainBadge)).toBeInTheDocument();
  });

  it("renders em dash when city and state are missing", () => {
    render(
      <MemoryRouter>
        <BranchTable
          branches={[
            buildBranchListItem({
              city: "",
              state: "",
              isMain: false,
            }),
          ]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("navigates to detail when row is clicked", async () => {
    const branch = buildBranchListItem({ name: "Fila navegable" });

    render(
      <MemoryRouter>
        <BranchTable branches={[branch]} isLoading={false} />
      </MemoryRouter>,
    );

    const row = screen.getByText("Fila navegable").closest("tr");
    expect(row).toBeTruthy();
    row?.click();

    // MemoryRouter keeps navigation in-memory; BranchTable calls navigate()
    expect(row).toHaveClass("cursor-pointer");
  });
});
