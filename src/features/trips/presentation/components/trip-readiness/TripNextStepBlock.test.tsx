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
    expect(screen.getByText(copy.titleDraft)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.completeRouteCargo }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.completeRouteCargo }),
    );
    expect(onNavigateTab).toHaveBeenCalledWith("route");
  });

  it("NS8: Reserva usa «Siguiente paso»; Programado «Qué sigue»", () => {
    const { rerender } = render(
      <TripNextStepBlock
        plan={{
          phase: "draft_incomplete",
          primary: { id: "complete_route_cargo", tab: "route" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
      />,
    );
    expect(screen.getByText(copy.titleDraft)).toBeInTheDocument();

    rerender(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "open_operate" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={vi.fn()}
      />,
    );
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.queryByText(copy.titleDraft)).not.toBeInTheDocument();
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

  it("Programado con borrador (F3d-4): Despachar… sin Abrir borrador", async () => {
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
        description={copy.descriptionScheduledWithDraft}
      />,
    );

    expect(
      screen.getByText(copy.descriptionScheduledWithDraft),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.openDraft }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.goToStart }));
    expect(onOpenOperate).toHaveBeenCalledOnce();
  });

  it("En ruta: primaria open_operate + secundaria Nota (F3d-4)", async () => {
    const user = userEvent.setup();
    const onOpenOperate = vi.fn();
    const onRegisterNote = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "in_progress",
          primary: { id: "open_operate" },
          secondaries: [{ id: "register_note" }],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={onOpenOperate}
        onRegisterNote={onRegisterNote}
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
    expect(
      screen.queryByRole("button", { name: copy.openDraft }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));
    expect(onOpenOperate).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: copy.registerNote }));
    expect(onRegisterNote).toHaveBeenCalledOnce();
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

  it("NS2: chips siempre visibles sin botón «Qué falta»", async () => {
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
      screen.queryByTestId("trip-next-step-what-missing"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.whatMissing)).not.toBeInTheDocument();
    expect(screen.getByTestId("trip-next-step-checklist")).toBeInTheDocument();
    expect(screen.getByText(readiness.scheduleGroup)).toBeInTheDocument();
    expect(screen.getByText(readiness.operateGroup)).toBeInTheDocument();
    expect(screen.getByText(readiness.order)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: `${readiness.rate}: ${readiness.pending}`,
      }),
    );
    expect(onReadinessItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rate", tab: "costs" }),
    );
  });

  it("NS7: assign_fleet primaria abre onAssignFleet; título Asigna unidad…", async () => {
    const user = userEvent.setup();
    const onAssignFleet = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "draft_incomplete",
          primary: { id: "assign_fleet" },
          secondaries: [{ id: "go_to_cargo", tab: "cargo" }],
        }}
        onNavigateTab={vi.fn()}
        onAssignFleet={onAssignFleet}
        description={copy.descriptionAssignFleet}
      />,
    );

    expect(screen.getByText(copy.titleAssignFleet)).toBeInTheDocument();
    expect(
      screen.getByText(copy.descriptionAssignFleet),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("trip-next-step-secondary-go_to_cargo"),
    ).toHaveTextContent(copy.completeCargo);

    const primary = screen.getByTestId("trip-next-step-primary");
    expect(primary.querySelector("svg.lucide-truck")).toBeTruthy();
    await user.click(primary);
    expect(onAssignFleet).toHaveBeenCalledOnce();
  });

  it("NS7: sin ruta + assign_fleet outline — título Completar ruta y cargas, CTA Completar ruta", () => {
    render(
      <TripNextStepBlock
        plan={{
          phase: "draft_incomplete",
          primary: { id: "complete_route_cargo", tab: "route" },
          secondaries: [{ id: "assign_fleet" }],
        }}
        onNavigateTab={vi.fn()}
        onAssignFleet={vi.fn()}
      />,
    );

    expect(screen.getByText(copy.completeRouteCargo)).toBeInTheDocument();
    expect(screen.getByTestId("trip-next-step-primary")).toHaveTextContent(
      copy.completeRoute,
    );
    expect(
      screen.getByTestId("trip-next-step-secondary-assign_fleet"),
    ).toHaveTextContent(copy.assignFleet);
    expect(
      screen
        .getByTestId("trip-next-step-secondary-assign_fleet")
        .querySelector("svg.lucide-truck"),
    ).toBeTruthy();
  });

  it("NS9: pie También en Completado con gastos y ventana", async () => {
    const user = userEvent.setup();
    const onGoToCosts = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "completed",
          primary: { id: "invoice" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
        onInvoice={vi.fn()}
        alsoFooter={{
          expensesInReviewCount: 1,
          lateExpensesUntilLabel: "8 dic 2026",
          onGoToCosts,
        }}
      />,
    );

    expect(screen.getByTestId("trip-next-step-also-footer")).toHaveTextContent(
      /También:/,
    );
    expect(screen.getByTestId("trip-next-step-also-costs")).toHaveTextContent(
      "1 gasto en revisión",
    );
    expect(
      screen.getByText(/Puedes registrar gastos tardíos hasta el 8 dic 2026/),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("trip-next-step-also-costs"));
    expect(onGoToCosts).toHaveBeenCalledOnce();
  });

  it("D44: primaria demoted a outline", () => {
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "open_operate" },
          secondaries: [],
        }}
        onNavigateTab={vi.fn()}
        onOpenOperate={vi.fn()}
        primaryDemoted
      />,
    );
    expect(screen.getByTestId("trip-next-step-primary")).toHaveAttribute(
      "data-demoted",
      "true",
    );
  });

  describe("NS6 icon map (Truck / FileText; RP-3 En ruta)", () => {
    it("CA1 Reserva sin cargas: primaria y outline sin Package/MapPin", () => {
      render(
        <TripNextStepBlock
          plan={{
            phase: "draft_incomplete",
            primary: { id: "complete_route_cargo", tab: "cargo" },
            secondaries: [{ id: "go_to_route", tab: "route" }],
          }}
          onNavigateTab={vi.fn()}
        />,
      );

      const primary = screen.getByTestId("trip-next-step-primary");
      const goToRoute = screen.getByTestId("trip-next-step-secondary-go_to_route");
      expect(primary.querySelector("svg")).toBeNull();
      expect(goToRoute.querySelector("svg")).toBeNull();
    });

    it("CA5 Programado: Despachar… con Truck", () => {
      render(
        <TripNextStepBlock
          plan={{
            phase: "scheduled",
            primary: { id: "open_operate" },
            secondaries: [],
          }}
          onNavigateTab={vi.fn()}
          onOpenOperate={vi.fn()}
        />,
      );

      const primary = screen.getByTestId("trip-next-step-primary");
      expect(primary.querySelector("svg.lucide-truck")).toBeTruthy();
    });

    it("CA4 En ruta: primaria sin ícono · Nota ghost sin ícono", () => {
      render(
        <TripNextStepBlock
          plan={{
            phase: "in_progress",
            primary: { id: "open_operate" },
            secondaries: [{ id: "register_note" }],
          }}
          onNavigateTab={vi.fn()}
          onOpenOperate={vi.fn()}
          onRegisterNote={vi.fn()}
          operatePrimaryLabel="Registrar salida"
          operateCtaLabel="Registrar salida"
        />,
      );

      const primary = screen.getByTestId("trip-next-step-primary");
      const note = screen.getByTestId("trip-next-step-secondary-register_note");
      expect(primary.querySelector("svg")).toBeNull();
      expect(note.querySelector("svg")).toBeNull();
      expect(note.className).toMatch(/text-muted-foreground/);
    });

    it("CA7 Completado: Facturar con FileText", () => {
      render(
        <TripNextStepBlock
          plan={{
            phase: "completed",
            primary: { id: "invoice" },
            secondaries: [],
          }}
          onNavigateTab={vi.fn()}
          onInvoice={vi.fn()}
        />,
      );

      const primary = screen.getByTestId("trip-next-step-primary");
      expect(primary.querySelector("svg.lucide-file-text")).toBeTruthy();
    });

    it("confirm_reserve sin slot: primaria sin ícono", () => {
      render(
        <TripNextStepBlock
          plan={{
            phase: "draft_ready",
            primary: { id: "confirm_reserve" },
            secondaries: [],
          }}
          onNavigateTab={vi.fn()}
        />,
      );

      const primary = screen.getByTestId("trip-next-step-primary");
      expect(primary.querySelector("svg")).toBeNull();
    });
  });
});
