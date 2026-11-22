import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripsListCopy } from "../copy/listCopy";
import {
  formatTripListArrivalLine,
  formatTripListClientSecondary,
  formatTripListDeparture,
  getTripListInvoicingAppearance,
  resolveTripListReserveGap,
  tripListIncomeValue,
} from "./tripListDisplay";

describe("formatTripListDeparture / arrival", () => {
  it("formatea salida sin año en hora México", () => {
    // 17 nov 2026 06:30 CDMX = 2026-11-17T12:30:00.000Z (CST)
    expect(
      formatTripListDeparture(new Date("2026-11-17T12:30:00.000Z")),
    ).toMatch(/17 nov, 06:30/i);
  });

  it("llegada mismo día solo hora; otro día con fecha; vacía —", () => {
    const departure = new Date("2026-11-17T12:30:00.000Z");
    expect(
      formatTripListArrivalLine(
        departure,
        new Date("2026-11-17T17:00:00.000Z"),
      ),
    ).toMatch(/Llegada 11:00/i);
    expect(
      formatTripListArrivalLine(
        departure,
        new Date("2026-11-18T16:30:00.000Z"),
      ),
    ).toMatch(/Llegada 18 nov, 10:30/i);
    expect(formatTripListArrivalLine(departure, null)).toBe(
      tripsListCopy.schedule.arrivalEmpty,
    );
  });
});

describe("resolveTripListReserveGap", () => {
  const base = {
    status: TripStatus.DRAFT,
    vehicle: { id: "v1", unitNumber: "U-1", licensePlate: "X" },
    driver: { id: "d1", fullName: "Ana" },
    originCity: "Monterrey",
    destinationCity: "Saltillo",
    cargoCount: 1,
  };

  it("prioriza unidad → conductor → ruta → cargas", () => {
    expect(
      resolveTripListReserveGap({
        ...base,
        vehicle: { id: "", unitNumber: "", licensePlate: "" },
      }),
    ).toBe(tripsListCopy.statusSecondary.missingVehicle);

    expect(
      resolveTripListReserveGap({
        ...base,
        driver: { id: "", fullName: "" },
      }),
    ).toBe(tripsListCopy.statusSecondary.missingDriver);

    expect(
      resolveTripListReserveGap({
        ...base,
        originCity: "",
        destinationCity: "",
      }),
    ).toBe(tripsListCopy.statusSecondary.missingRoute);

    expect(resolveTripListReserveGap({ ...base, cargoCount: 0 })).toBe(
      tripsListCopy.statusSecondary.missingCargos,
    );
  });

  it("no aplica fuera de Reserva", () => {
    expect(
      resolveTripListReserveGap({
        ...base,
        status: TripStatus.SCHEDULED,
        vehicle: { id: "", unitNumber: "", licensePlate: "" },
      }),
    ).toBeNull();
  });
});

describe("getTripListInvoicingAppearance", () => {
  it("Listo para facturar / Pendiente / Sin factura / Atención fiscal", () => {
    expect(
      getTripListInvoicingAppearance({
        status: TripStatus.COMPLETED,
        cfdiEmissionIntent: "emitir_cfdi",
        requiresFiscalAttention: false,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({ canGenerateInvoice: true }),
      }),
    ).toMatchObject({ mode: "badge", label: "Listo para facturar" });

    expect(
      getTripListInvoicingAppearance({
        status: TripStatus.SCHEDULED,
        cfdiEmissionIntent: "emitir_cfdi",
        requiresFiscalAttention: false,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({ canGenerateInvoice: false }),
      }),
    ).toEqual({ mode: "quiet", label: "Pendiente" });

    expect(
      getTripListInvoicingAppearance({
        status: TripStatus.COMPLETED,
        cfdiEmissionIntent: "sin_cfdi_efectivo",
        requiresFiscalAttention: false,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({ canGenerateInvoice: false }),
      }),
    ).toEqual({ mode: "quiet", label: "Sin factura" });

    expect(
      getTripListInvoicingAppearance({
        status: TripStatus.COMPLETED,
        cfdiEmissionIntent: "emitir_cfdi",
        requiresFiscalAttention: true,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          hasActiveInvoice: true,
          invoiceStatus: "stamped",
          invoiceFolio: "F-1198",
          invoiceId: "inv-1",
        }),
      }),
    ).toMatchObject({
      mode: "badge",
      label: tripsListCopy.badge.fiscalAttention,
    });
  });

  it("traslado o cancelado sin factura → empty", () => {
    expect(
      getTripListInvoicingAppearance({
        status: TripStatus.COMPLETED,
        routeType: "transfer",
        cfdiEmissionIntent: "emitir_cfdi",
        requiresFiscalAttention: false,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture(),
      }),
    ).toEqual({ mode: "empty" });

    expect(
      getTripListInvoicingAppearance({
        status: TripStatus.CANCELLED,
        cfdiEmissionIntent: "emitir_cfdi",
        requiresFiscalAttention: false,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture(),
      }),
    ).toEqual({ mode: "empty" });
  });
});

describe("formatTripListClientSecondary / income", () => {
  it("añade · +N y Sin cliente", () => {
    expect(
      formatTripListClientSecondary({
        client: { id: "c1", legalName: "Abarrotes" },
        clientCount: 3,
      }),
    ).toBe("Abarrotes · +2");
    expect(
      formatTripListClientSecondary({ client: null, clientCount: 0 }),
    ).toBe(tripsListCopy.columns.noClient);
  });

  it("income omite 0 / null", () => {
    expect(tripListIncomeValue(undefined)).toBeNull();
    expect(tripListIncomeValue(0)).toBeNull();
    expect(tripListIncomeValue(18500)).toBe(18500);
  });
});
