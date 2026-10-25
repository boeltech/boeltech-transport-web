import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TripStatus } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import type { TripReadinessItem } from "../../hooks/useTripReadiness";
import { TripNextStepBlock } from "./TripNextStepBlock";

const copy = tripDetailCopy.shell.nextStep;
const readiness = tripDetailCopy.shell.readiness;

const DRAFT_ITEMS: TripReadinessItem[] = [
  { id: "order", done: true, group: "schedule" },
  { id: "fleet", done: true, group: "schedule" },
  { id: "departure", done: true, group: "schedule", tab: "overview" },
  { id: "arrival", done: false, group: "schedule", tab: "overview" },
  { id: "rate", done: false, group: "schedule", tab: "costs" },
  { id: "mileage", done: true, group: "schedule", tab: "overview" },
  { id: "route", done: false, group: "operate", tab: "route" },
  { id: "cargo", done: false, group: "operate", tab: "route" },
];

describe("TripNextStepBlock", () => {
  it("renders one primary and up to two secondaries for draft incomplete", async () => {
    const user = userEvent.setup();
    const onNavigateTab = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "draft_incomplete",
          primary: { id: "complete_route_cargo", tab: "route" },
          secondaries: [{ id: "go_to_cargo", tab: "cargo" }],
        }}
        onNavigateTab={onNavigateTab}
      />,
    );

    expect(screen.getByTestId("trip-next-step-block")).toBeInTheDocument();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.completeRouteCargo }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.completeRouteCargo }),
    );
    expect(onNavigateTab).toHaveBeenCalledWith("route");
  });

  it("Programado billable: Facturar primary + Ir a iniciar secondary (D17)", async () => {
    const user = userEvent.setup();
    const onInvoice = vi.fn();
    const onNavigateTab = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "invoice" },
          secondaries: [{ id: "go_to_tracking", tab: "tracking" }],
        }}
        onNavigateTab={onNavigateTab}
        onInvoice={onInvoice}
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.invoice }));
    expect(onInvoice).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: copy.goToStart }));
    expect(onNavigateTab).toHaveBeenCalledWith("tracking");
  });

  it("Programado con borrador: Ir a iniciar + Abrir borrador (D16–D18)", async () => {
    const user = userEvent.setup();
    const onNavigateTab = vi.fn();
    const onOpenDraft = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "go_to_tracking", tab: "tracking" },
          secondaries: [{ id: "open_draft", invoiceId: "inv-1" }],
        }}
        onNavigateTab={onNavigateTab}
        onOpenDraft={onOpenDraft}
        description={copy.descriptionScheduledWithDraft}
      />,
    );

    expect(
      screen.getByText(copy.descriptionScheduledWithDraft),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/empezar a facturar/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.goToStart }));
    expect(onNavigateTab).toHaveBeenCalledWith("tracking");
    await user.click(screen.getByRole("button", { name: copy.openDraft }));
    expect(onOpenDraft).toHaveBeenCalledWith("inv-1");
  });

  it("Programado con N borradores: Ver facturas dispara onViewInvoices (D18′)", async () => {
    const user = userEvent.setup();
    const onViewInvoices = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "go_to_tracking", tab: "tracking" },
          secondaries: [{ id: "view_invoices" }],
        }}
        onNavigateTab={vi.fn()}
        onViewInvoices={onViewInvoices}
        description={copy.descriptionScheduledWithDrafts}
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.viewInvoices }));
    expect(onViewInvoices).toHaveBeenCalledOnce();
  });

  it("En ruta: primaria Ir a Seguimiento, nunca Ir a iniciar (D20)", async () => {
    const user = userEvent.setup();
    const onNavigateTab = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "in_progress",
          primary: { id: "go_to_tracking", tab: "tracking" },
          secondaries: [{ id: "open_draft", invoiceId: "inv-1" }],
        }}
        onNavigateTab={onNavigateTab}
        onOpenDraft={vi.fn()}
        description={copy.descriptionInProgressWithDraft}
      />,
    );

    expect(
      screen.getByRole("button", { name: copy.goToTracking }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.goToStart }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.goToTracking }));
    expect(onNavigateTab).toHaveBeenCalledWith("tracking");
  });

  it("Qué falta is collapsed by default and expands schedule + operate (F8)", async () => {
    const user = userEvent.setup();
    const onReadinessItemClick = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "draft_incomplete",
          primary: { id: "complete_route_cargo", tab: "route" },
          secondaries: [{ id: "go_to_cargo", tab: "cargo" }],
        }}
        onNavigateTab={vi.fn()}
        readinessStatus={TripStatus.DRAFT}
        readinessItems={DRAFT_ITEMS}
        onReadinessItemClick={onReadinessItemClick}
      />,
    );

    expect(
      screen.queryByText(readiness.title),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(readiness.scheduleGroup),
    ).not.toBeInTheDocument();

    const toggle = screen.getByTestId("trip-next-step-what-missing");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent(copy.whatMissing);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(readiness.scheduleGroup)).toBeInTheDocument();
    expect(screen.getByText(readiness.operateGroup)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: `${readiness.rate}: ${readiness.pending}`,
      }),
    );
    expect(onReadinessItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rate", tab: "costs" }),
    );
  });

  it("shows enriched description when provided (fleet blocked)", () => {
    render(
      <TripNextStepBlock
        plan={{
          phase: "draft_ready",
          primary: { id: "confirm_reserve" },
          secondaries: [{ id: "go_to_route", tab: "route" }],
        }}
        confirmReserveSlot={
          <button type="button">{copy.confirmReserve}</button>
        }
        onNavigateTab={vi.fn()}
        description={copy.descriptionDraftReadyFleetBlocked}
      />,
    );

    expect(
      screen.getByText(copy.descriptionDraftReadyFleetBlocked),
    ).toBeInTheDocument();
  });
});
