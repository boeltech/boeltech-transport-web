import { describe, expect, it } from "vitest";

import { tripDetailCopy } from "../copy";
import { resolveTripNextStepDescription } from "./resolveTripNextStepDescription";

const copy = tripDetailCopy.shell.nextStep;

describe("resolveTripNextStepDescription (F8 / F9)", () => {
  it("draft incomplete mentions deferred fields at confirm", () => {
    expect(
      resolveTripNextStepDescription({ phase: "draft_incomplete" }),
    ).toBe(copy.descriptionDraftIncomplete);
    expect(copy.descriptionDraftIncomplete).toMatch(/confirmar/i);
  });

  it("draft ready without fleet uses fleet-blocked copy", () => {
    expect(
      resolveTripNextStepDescription({
        phase: "draft_ready",
        fleetReady: false,
      }),
    ).toBe(copy.descriptionDraftReadyFleetBlocked);
    expect(copy.descriptionDraftReadyFleetBlocked).toMatch(/unidad|conductor/i);
  });

  it("draft ready with fleet mentions deferred fields", () => {
    expect(
      resolveTripNextStepDescription({
        phase: "draft_ready",
        fleetReady: true,
      }),
    ).toBe(copy.descriptionDraftReady);
  });

  it("scheduled A: create eleva → facturar flete + iniciar Seguimiento", () => {
    expect(
      resolveTripNextStepDescription({
        phase: "scheduled",
        elevateInvoice: true,
      }),
    ).toBe(copy.descriptionScheduledCreate);
    expect(copy.descriptionScheduledCreate).toMatch(/facturar el flete/i);
    expect(copy.descriptionScheduledCreate).not.toMatch(/empezar a facturar/i);
  });

  it("scheduled B: 1 borrador → no «empezar a facturar»", () => {
    const text = resolveTripNextStepDescription({
      phase: "scheduled",
      linkedDraftCount: 1,
    });
    expect(text).toBe(copy.descriptionScheduledWithDraft);
    expect(text).toMatch(/borrador/i);
    expect(text).not.toMatch(/empezar a facturar/i);
  });

  it("scheduled B plural: >1 borrador", () => {
    expect(
      resolveTripNextStepDescription({
        phase: "scheduled",
        linkedDraftCount: 2,
      }),
    ).toBe(copy.descriptionScheduledWithDrafts);
  });

  it("scheduled C: sin create ni borrador", () => {
    expect(resolveTripNextStepDescription({ phase: "scheduled" })).toBe(
      copy.descriptionScheduledOperate,
    );
    expect(copy.descriptionScheduledOperate).not.toMatch(/empezar a facturar/i);
  });

  it("in_progress B: borrador; sin «Ir a iniciar» en copy", () => {
    const text = resolveTripNextStepDescription({
      phase: "in_progress",
      linkedDraftCount: 1,
    });
    expect(text).toBe(copy.descriptionInProgressWithDraft);
    expect(text).toMatch(/borrador/i);
    expect(text).not.toMatch(/iniciar/i);
  });

  it("F11c/D28 scheduled: split parcial prioriza progreso N de M", () => {
    const text = resolveTripNextStepDescription({
      phase: "scheduled",
      elevateInvoice: true,
      linkedDraftCount: 1,
      splitLegsInvoiced: 2,
      splitLegsTotal: 4,
    });
    expect(text).toBe(copy.descriptionScheduledSplitPartial(2, 4));
    expect(text).toMatch(/Se facturaron 2 de 4 porciones/);
  });

  it("F11c/D28 in_progress: split parcial prioriza progreso N de M", () => {
    const text = resolveTripNextStepDescription({
      phase: "in_progress",
      elevateInvoice: true,
      linkedDraftCount: 2,
      splitLegsInvoiced: 1,
      splitLegsTotal: 3,
    });
    expect(text).toBe(copy.descriptionInProgressSplitPartial(1, 3));
    expect(text).toMatch(/Se facturaron 1 de 3 porciones/);
  });

  it("F11c/D28 completed: split parcial prioriza progreso N de M", () => {
    const text = resolveTripNextStepDescription({
      phase: "completed",
      splitLegsInvoiced: 2,
      splitLegsTotal: 4,
    });
    expect(text).toBe(copy.descriptionCompletedSplitPartial(2, 4));
    expect(text).toMatch(/Se facturaron 2 de 4 porciones/);
  });

  it("F11c/D28: no aplica split parcial si 0 facturadas", () => {
    expect(
      resolveTripNextStepDescription({
        phase: "scheduled",
        elevateInvoice: true,
        splitLegsInvoiced: 0,
        splitLegsTotal: 4,
      }),
    ).toBe(copy.descriptionScheduledCreate);
  });

  it("F11c/D28: no aplica split parcial si completo", () => {
    expect(
      resolveTripNextStepDescription({
        phase: "in_progress",
        elevateInvoice: true,
        splitLegsInvoiced: 4,
        splitLegsTotal: 4,
      }),
    ).toBe(copy.descriptionInProgressCreate);
    expect(
      resolveTripNextStepDescription({
        phase: "completed",
        splitLegsInvoiced: 3,
        splitLegsTotal: 3,
      }),
    ).toBe(copy.descriptionCompleted);
  });
});
