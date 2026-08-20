import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TrailerListItem } from "../../domain";
import { TrailerStatus } from "../../domain";
import { trailersCopy } from "../copy/trailersCopy";
import { TrailerTable } from "./TrailerTable";

const copy = trailersCopy.list.table;

vi.mock("./TrailerActions", () => ({
  TrailerActions: ({ licensePlate }: { licensePlate: string }) => (
    <button type="button">{`acciones-${licensePlate}`}</button>
  ),
}));

function buildTrailer(
  overrides: Partial<TrailerListItem> = {},
): TrailerListItem {
  return {
    id: "trailer-1",
    tenantId: "tenant-1",
    licensePlate: "REM1234",
    satSubTipoRemCode: "CTR001",
    status: TrailerStatus.AVAILABLE,
    branchId: null,
    isActive: true,
    notes: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

describe("TrailerTable", () => {
  it("renders plate, type name, status and truncated notes", () => {
    render(
      <TrailerTable
        trailers={[buildTrailer({ notes: "  Patio norte  " })]}
        isLoading={false}
        typeLabelFor={() => "Caja seca"}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: copy.plate }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: copy.type }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: copy.status }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: copy.notes }),
    ).toBeInTheDocument();
    expect(screen.getByText("REM1234")).toBeInTheDocument();
    expect(screen.getByText("Caja seca")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Patio norte")).toBeInTheDocument();
    expect(screen.queryByText("CTR001")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "acciones-REM1234" })).toBeInTheDocument();
  });

  it("never falls back to the raw type code", () => {
    render(
      <TrailerTable
        trailers={[buildTrailer({ satSubTipoRemCode: "UNKNOWN" })]}
        isLoading={false}
        typeLabelFor={() => null}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText(copy.typeMissing).length).toBeGreaterThan(0);
    expect(screen.queryByText("UNKNOWN")).not.toBeInTheDocument();
  });

  it("does not treat a row click as navigation or edit", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <TrailerTable
        trailers={[buildTrailer()]}
        isLoading={false}
        typeLabelFor={() => "Caja seca"}
        onEdit={onEdit}
      />,
    );

    await user.click(screen.getByText("REM1234"));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
