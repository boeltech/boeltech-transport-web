import { describe, expect, it } from "vitest";
import { dispatchRunsCopy } from "./dispatchRunsCopy";

const forbidden =
  /corrida|digest|despachar|encolar|esquema de facturación|timbrar|timbrad|cadence|ancla|exclusive|actual_arrival/i;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (typeof value === "function") {
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) collectStrings(nested, acc);
  }
  return acc;
}

describe("dispatchRunsCopy glossary", () => {
  it("workbench y periodo no usan jerga de corrida/esquema/timbrar", () => {
    const blob = collectStrings({
      workbench: dispatchRunsCopy.workbench,
      tab: dispatchRunsCopy.tab,
      status: dispatchRunsCopy.status,
      detail: dispatchRunsCopy.detail,
      toast: dispatchRunsCopy.toast,
    }).join("\n");
    expect(blob).not.toMatch(forbidden);
    expect(blob).not.toMatch(/Historial/);
    expect(blob).not.toMatch(/PDF\/XML adjuntos/i);
  });

  it("onboarding del periodo no manda a Pendientes", () => {
    const steps = dispatchRunsCopy.tab.empty.onboardingSteps;
    expect(steps).toHaveLength(3);
    expect(steps[0]?.label).toMatch(/frecuencia aquí/i);
    expect(steps[1]?.href).toBe("/clients");
    expect(steps[2]?.label).toMatch(/Arma el envío del periodo/i);
    expect(JSON.stringify(steps[2])).not.toMatch(/Pendientes/i);
    expect(JSON.stringify(steps)).not.toMatch(/settings\/billing-schemes/);
  });

  it("toolbar del periodo usa Filtros y empty virgen distinto del recorte", () => {
    const filters = dispatchRunsCopy.tab.filters;
    expect(filters.showFilters).toBe("Filtros");
    expect(filters.statusLabel).toBe("Estado");
    expect(filters.statusAll).toBe("Todos");
    expect(filters.schemeLabel).toBe("Frecuencia de envío");
    expect(filters.schemeAll).toBe("Todas");
    expect(JSON.stringify(filters)).not.toMatch(/Más filtros/);
    expect(dispatchRunsCopy.tab.empty.recorteTitle).toMatch(/estos filtros/);
    expect(dispatchRunsCopy.tab.empty.title).not.toMatch(/estos filtros/);
  });

  it("estados de lote usan Lista para revisar y Automático", () => {
    expect(dispatchRunsCopy.status.previewed).toBe("Lista para revisar");
    expect(dispatchRunsCopy.status.completed).toBe("Completada");
    expect(dispatchRunsCopy.status.cancelled).toBe("Cancelada");
    expect(dispatchRunsCopy.status.sending).toBe("Enviando");
    expect(dispatchRunsCopy.tab.origin.scheduled).toBe("Automático");
    expect(dispatchRunsCopy.tab.origin.manual).toBe("Manual");
  });

  it("copy del corte cerrado y del lote habla de enlace ZIP, no adjuntos", () => {
    expect(dispatchRunsCopy.tab.createDialog.title).toBe(
      "Armar envío del periodo",
    );
    expect(dispatchRunsCopy.tab.createDialog.description).toMatch(
      /último corte ya cerrado/i,
    );
    expect(
      dispatchRunsCopy.detail.periodCalendar("18", "24", "25"),
    ).toBe(
      "Viajes que cerraron del 18 al 24. El 25 es el día del corte y no entra.",
    );
    expect(dispatchRunsCopy.detail.periodEvent(48)).toBe(
      "Viajes que cerraron en las últimas 48 horas, hasta ahora.",
    );
    expect(dispatchRunsCopy.detail.confirm.emailNote).toMatch(/enlace/);
    expect(dispatchRunsCopy.detail.confirm.emailNote).not.toMatch(/adjunto/i);
    expect(dispatchRunsCopy.detail.resendConfirm.emailNote).toMatch(/enlace/);
    expect(dispatchRunsCopy.detail.resendConfirm.emailNote).not.toMatch(
      /adjunto/i,
    );
    expect(dispatchRunsCopy.tab.createDialog.alreadyOpen.title).toBe(
      "Ya hay un lote de este corte",
    );
    expect(dispatchRunsCopy.tab.createDialog.alreadyOpen.bodyOnList).toMatch(
      /Ábrelo en la lista/i,
    );
    expect(
      dispatchRunsCopy.tab.createDialog.alreadyOpen.bodyFromWorkbench,
    ).toMatch(/Por periodo/i);
  });
});
