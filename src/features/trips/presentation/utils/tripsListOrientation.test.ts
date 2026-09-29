import { describe, expect, it } from "vitest";

import { tripsListCopy } from "../copy/listCopy";
import {
  resolveTripsListEmptyDescription,
  resolveTripsListPageDescription,
  shouldShowTripsJobEmpty,
} from "./tripsListOrientation";

const staffFlags = {
  isClientPortal: false,
  isDriverPortal: false,
  isDispatcher: false,
  isAccountant: false,
  isManager: false,
  isOperator: false,
};

const emptyOpenFlags = {
  isLeanTripPortal: false,
  hasFilters: false,
  hasActiveBucket: false,
  fiscalAttentionOnly: false,
  hasOverdueFilter: false,
  isManager: false,
  isOperator: false,
};

describe("resolveTripsListPageDescription", () => {
  it("usa copy de gastos para operator, sin flota ni hermanos", () => {
    const description = resolveTripsListPageDescription({
      ...staffFlags,
      isOperator: true,
    });
    expect(description).toBe(tripsListCopy.page.descriptionOperator);
    expect(description).toMatch(/\bCostos\b/);
    expect(description).not.toMatch(/flota/i);
    expect(description).not.toBe(tripsListCopy.page.descriptionDispatcher);
    expect(description).not.toBe(tripsListCopy.page.descriptionAccountant);
    expect(description).not.toBe(tripsListCopy.page.descriptionManager);
  });

  it("usa copy de ciclo operativo para driver, sin flota ni hermanos", () => {
    const description = resolveTripsListPageDescription({
      ...staffFlags,
      isDriverPortal: true,
    });
    expect(description).toBe(tripsListCopy.page.descriptionDriver);
    expect(description).toMatch(/Inicia/i);
    expect(description).toMatch(/paradas/i);
    expect(description).not.toMatch(/flota/i);
    expect(description).not.toBe(tripsListCopy.page.descriptionDispatcher);
    expect(description).not.toBe(tripsListCopy.page.descriptionOperator);
  });

  it("no reescribe description de dispatcher/accountant/manager", () => {
    expect(
      resolveTripsListPageDescription({ ...staffFlags, isDispatcher: true }),
    ).toBe(tripsListCopy.page.descriptionDispatcher);
    expect(
      resolveTripsListPageDescription({ ...staffFlags, isAccountant: true }),
    ).toBe(tripsListCopy.page.descriptionAccountant);
    expect(
      resolveTripsListPageDescription({ ...staffFlags, isManager: true }),
    ).toBe(tripsListCopy.page.descriptionManager);
  });
});

describe("shouldShowTripsJobEmpty", () => {
  it("oculta los 4 pasos de patio al operator y al manager", () => {
    expect(shouldShowTripsJobEmpty(emptyOpenFlags)).toBe(true);
    expect(
      shouldShowTripsJobEmpty({ ...emptyOpenFlags, isOperator: true }),
    ).toBe(false);
    expect(
      shouldShowTripsJobEmpty({ ...emptyOpenFlags, isManager: true }),
    ).toBe(false);
  });

  it("sigue mostrando el empty de patio al dispatcher", () => {
    expect(
      shouldShowTripsJobEmpty({ ...emptyOpenFlags, isOperator: false }),
    ).toBe(true);
  });
});

describe("resolveTripsListEmptyDescription", () => {
  it("operator sin filtros no enseña los 4 pasos; filtrado no enseña el job", () => {
    expect(
      resolveTripsListEmptyDescription({
        hasOverdueFilter: false,
        hasFilters: false,
        isClientPortal: false,
        isDriverPortal: false,
        isManager: false,
        isOperator: true,
        fiscalAttentionOnly: false,
        showJobEmpty: false,
      }),
    ).toBe(tripsListCopy.empty.noDataDescriptionOperator);
    expect(tripsListCopy.empty.noDataDescriptionOperator).toMatch(
      /\bCostos\b/,
    );
    expect(tripsListCopy.empty.noDataDescriptionOperator).not.toMatch(
      /Reservar|Confirmar|Iniciar/i,
    );

    expect(
      resolveTripsListEmptyDescription({
        hasOverdueFilter: false,
        hasFilters: true,
        isClientPortal: false,
        isDriverPortal: false,
        isManager: false,
        isOperator: true,
        fiscalAttentionOnly: false,
        showJobEmpty: false,
      }),
    ).toBe(tripsListCopy.empty.filteredDescription);
    expect(tripsListCopy.empty.filteredDescription).not.toMatch(/Reservar/i);
  });

  it("client sin filtros conserva empty de asignación, no Reservar", () => {
    expect(
      resolveTripsListEmptyDescription({
        hasOverdueFilter: false,
        hasFilters: false,
        isClientPortal: true,
        isDriverPortal: false,
        isManager: false,
        isOperator: false,
        fiscalAttentionOnly: false,
        showJobEmpty: false,
      }),
    ).toBe(tripsListCopy.empty.noDataDescriptionClient);
    expect(tripsListCopy.empty.noDataDescriptionClient).toMatch(/asignen/i);
    expect(tripsListCopy.empty.noDataDescriptionClient).not.toMatch(
      /Reservar|Confirmar|Iniciar/i,
    );
  });

  it("driver sin filtros conserva empty de asignación, no 4 pasos", () => {
    expect(
      resolveTripsListEmptyDescription({
        hasOverdueFilter: false,
        hasFilters: false,
        isClientPortal: false,
        isDriverPortal: true,
        isManager: false,
        isOperator: false,
        fiscalAttentionOnly: false,
        showJobEmpty: false,
      }),
    ).toBe(tripsListCopy.empty.noDataDescriptionDriver);
    expect(tripsListCopy.empty.noDataDescriptionDriver).toMatch(/asignen/i);
    expect(tripsListCopy.empty.noDataDescriptionDriver).not.toMatch(
      /Reservar|Confirmar/i,
    );
  });
});
