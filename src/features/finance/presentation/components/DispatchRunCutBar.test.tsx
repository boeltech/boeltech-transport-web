import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { DispatchRunCutBar } from "./DispatchRunCutBar";

const copy = dispatchRunsCopy.detail;

describe("DispatchRunCutBar", () => {
  it("muestra periodo como SoT y Mandar cuando showSend", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(
      <DispatchRunCutBar
        periodLabel="1 ago – 7 ago"
        frequencyName="Corte semanal"
        invoiceCount={2}
        repCount={1}
        pendingCount={0}
        showSend
        onSend={onSend}
      />,
    );

    expect(screen.getByText("1 ago – 7 ago")).toBeInTheDocument();
    expect(screen.getByText("Corte semanal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.sendCta }));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("chip Faltan si pending>0; riel solo con showPendingRail", () => {
    const { rerender } = render(
      <DispatchRunCutBar
        periodLabel="1 ago – 7 ago"
        frequencyName="Corte semanal"
        invoiceCount={1}
        repCount={0}
        pendingCount={3}
        showSend={false}
        showPendingRail
      />,
    );

    expect(screen.getByText(copy.counts.pendingStamp)).toBeInTheDocument();
    expect(screen.getByText(copy.cutBar.pendingNote(3))).toBeInTheDocument();

    rerender(
      <DispatchRunCutBar
        periodLabel="1 ago – 7 ago"
        frequencyName="Corte semanal"
        invoiceCount={1}
        repCount={0}
        pendingCount={3}
        showSend={false}
        showPendingRail={false}
      />,
    );

    expect(screen.getByText(copy.counts.pendingStamp)).toBeInTheDocument();
    expect(screen.queryByText(copy.cutBar.pendingNote(3))).not.toBeInTheDocument();
  });

  it("Completada sin CTA Mandar cuando showSend=false", () => {
    render(
      <DispatchRunCutBar
        periodLabel="1 ago – 7 ago"
        frequencyName="Corte semanal"
        invoiceCount={2}
        repCount={0}
        pendingCount={0}
        showSend={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: copy.sendCta }),
    ).not.toBeInTheDocument();
  });
});
