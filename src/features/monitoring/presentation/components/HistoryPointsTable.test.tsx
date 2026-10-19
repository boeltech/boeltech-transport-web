import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FleetHistoryPoint } from "../../domain";
import { HistoryPointsTable } from "./HistoryPointsTable";

const points: FleetHistoryPoint[] = [
  {
    seq: 1,
    latitude: 19.43,
    longitude: -99.13,
    speedKmh: 64,
    courseDeg: 45,
    recordedAt: "2026-10-19T15:17:16Z",
    movementStatus: "moving",
    satellites: 9,
    batteryPct: null,
    odometerKm: 100,
  },
  {
    seq: 2,
    latitude: 19.44,
    longitude: -99.12,
    speedKmh: 0,
    courseDeg: 180,
    recordedAt: "2026-10-19T15:18:16Z",
    movementStatus: "stopped",
    satellites: null,
    batteryPct: 80,
    odometerKm: null,
  },
];

describe("HistoryPointsTable", () => {
  it("renderiza columnas y sync selección al clic", async () => {
    const user = userEvent.setup();
    const onSelectSeq = vi.fn();
    render(
      <HistoryPointsTable
        points={points}
        selectedSeq={1}
        onSelectSeq={onSelectSeq}
      />,
    );

    expect(screen.getByText("Detalle de recorrido")).toBeInTheDocument();
    expect(screen.getByText("En movimiento")).toBeInTheDocument();
    expect(screen.getByText("Detenido")).toBeInTheDocument();
    expect(screen.getByText("↗ NE 045°")).toBeInTheDocument();

    await user.click(screen.getByTestId("history-row-2"));
    expect(onSelectSeq).toHaveBeenCalledWith(2);
  });

  it("marca aria-selected en la fila activa", () => {
    render(
      <HistoryPointsTable
        points={points}
        selectedSeq={2}
        onSelectSeq={() => undefined}
      />,
    );
    expect(screen.getByTestId("history-row-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("history-row-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
