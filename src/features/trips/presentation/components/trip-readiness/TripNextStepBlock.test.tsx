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

  it("Programado: Despachar… abre operate sheet (HB-G2-CTA / D11)", async () => {
    const user = userEvent.setup();
    const onOpenOperate = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "open_operate" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={onOpenOperate}
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.goToStart }));
    expect(onOpenOperate).toHaveBeenCalledOnce();
  });

  it("Programado con borrador: Despachar… + Abrir borrador (D18)", async () => {
    const user = userEvent.setup();
    const onOpenOperate = vi.fn();
    const onOpenDraft = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "open_operate" },
          secondaries: [{ id: "open_draft", invoiceId: "inv-1" }],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={onOpenOperate}
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
    expect(onOpenOperate).toHaveBeenCalledOnce();
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
          primary: { id: "open_operate" },
          secondaries: [{ id: "view_invoices" }],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={vi.fn()}
        onViewInvoices={onViewInvoices}
        description={copy.descriptionScheduledWithDrafts}
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.viewInvoices }));
    expect(onViewInvoices).toHaveBeenCalledOnce();
  });

  it("En ruta: primaria open_operate con label dinámico", async () => {
    const user = userEvent.setup();
    const onOpenOperate = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "in_progress",
          primary: { id: "open_operate" },
          secondaries: [{ id: "open_draft", invoiceId: "inv-1" }],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={onOpenOperate}
        onOpenDraft={vi.fn()}
        operatePrimaryLabel="Registrar salida"
        description={copy.descriptionInProgressWithDraft}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Registrar salida" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.goToStart }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));
    expect(onOpenOperate).toHaveBeenCalledOnce();
  });

  it("P2-1: CTA corto distinto del título contextual largo", () => {
    const longTitle = "Registrar salida — Parada 2 · Escala · Carga";
    render(
      <TripNextStepBlock
        plan={{
          phase: "in_progress",
          primary: { id: "open_operate" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={vi.fn()}
        operatePrimaryLabel={longTitle}
        operateCtaLabel="Registrar salida"
      />,
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(
      screen.getByTestId("trip-next-step-primary"),
    ).toHaveTextContent("Registrar salida");
    expect(screen.getByTestId("trip-next-step-primary")).not.toHaveTextContent(
      "Parada 2",
    );
  });

  it("P2-2/D33: late usa Nh de retraso, no «va tarde»", () => {
    render(
      <TripNextStepBlock
        plan={{
          phase: "in_progress",
          primary: { id: "open_operate" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={vi.fn()}
        operatePrimaryLabel="Registrar llegada"
        operateCtaLabel="Registrar llegada"
        late
        lateDelayLabel="3 h de retraso"
      />,
    );

    expect(screen.getByText(/Qué sigue · 3 h de retraso/)).toBeInTheDocument();
    expect(screen.queryByText(/va tarde/i)).not.toBeInTheDocument();
  });

  it("Qué falta opens by default in draft (D3) and expands schedule + operate", async () => {
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

    const toggle = screen.getByTestId("trip-next-step-what-missing");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent(copy.whatMissing);
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
