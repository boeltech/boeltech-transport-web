import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TrailerListItem } from "../../domain";
import { TrailerStatus } from "../../domain";
import { TrailerCard } from "./TrailerCard";

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
    status: TrailerStatus.RESERVED,
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

describe("TrailerCard", () => {
  it("shows plate, type name, status and row actions without Ver más", () => {
    render(
      <TrailerCard
        trailer={buildTrailer()}
        typeLabel="Caja seca"
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("REM1234")).toBeInTheDocument();
    expect(screen.getByText("Caja seca")).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.queryByText("CTR001")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ver más/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "acciones-REM1234" })).toBeInTheDocument();
  });

  it("does not call onEdit when clicking the card body", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <TrailerCard
        trailer={buildTrailer({ notes: "Patio norte" })}
        typeLabel="Caja seca"
        onEdit={onEdit}
      />,
    );

    expect(screen.getByText("Patio norte")).toBeInTheDocument();
    await user.click(screen.getByText("REM1234"));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
