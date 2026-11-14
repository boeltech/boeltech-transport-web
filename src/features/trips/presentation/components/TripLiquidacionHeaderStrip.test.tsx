import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import { TripLiquidacionHeaderStrip } from "./TripLiquidacionHeaderStrip";

describe("TripLiquidacionHeaderStrip", () => {
  it("muestra chip Sin factura y abre Historial", async () => {
    const user = userEvent.setup();
    const onOpenHistory = vi.fn();
    render(
      <TripLiquidacionHeaderStrip
        mode="sin_factura"
        onOpenHistory={onOpenHistory}
        actions={<button type="button">CTA</button>}
      />,
    );

    expect(
      screen.getByText(cfdiEmissionIntentCopy.chip.sinCfdi),
    ).toBeInTheDocument();
    expect(screen.getByText("CTA")).toBeInTheDocument();
    expect(screen.queryByText(/congelado/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.history,
      }),
    );
    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it("omite lockReason y label por defecto; Con factura", () => {
    render(
      <TripLiquidacionHeaderStrip
        mode="con_factura"
        lockReason={null}
        onOpenHistory={() => undefined}
      />,
    );

    expect(
      screen.getByText(cfdiEmissionIntentCopy.chip.conCfdi),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(cfdiEmissionIntentCopy.field.label),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(cfdiEmissionIntentCopy.governance.cashFreeze),
    ).not.toBeInTheDocument();
  });

  it("puede mostrar lockReason cuando se pasa (no default del polish)", () => {
    render(
      <TripLiquidacionHeaderStrip
        mode="sin_factura"
        lockReason="Motivo de prueba"
        onOpenHistory={() => undefined}
        showHistory={false}
      />,
    );
    expect(screen.getByText("Motivo de prueba")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: cfdiEmissionIntentCopy.governance.history,
      }),
    ).not.toBeInTheDocument();
  });
});
