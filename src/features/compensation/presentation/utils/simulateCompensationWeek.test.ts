import { describe, expect, it } from "vitest";
import {
  buildSampleWeekTrips,
  DEFAULT_SAMPLE_WEEK_TRIPS,
  simulateCompensation,
  simulateCompensationWeek,
  type SampleWeekTrip,
} from "./simulateCompensation";
import { COMMISSION_GOLDEN_CASES } from "./commissionGoldenCases";
import type { CompensationTemplateRule } from "../../domain/entities";

const ratePerKmRule: CompensationTemplateRule = {
  routeType: "long_haul",
  commissionType: "rate_per_km",
  rateValue: 3,
  minimumGuaranteedAmount: 1500,
};

const localRule: CompensationTemplateRule = {
  routeType: "local",
  commissionType: "fixed_per_trip",
  rateValue: 650,
  minimumGuaranteedAmount: 0,
};

const corridorTrip: SampleWeekTrip = {
  id: "sample-corridor-real",
  label: "GDL → León",
  input: { routeType: "long_haul", distanceKm: 920, freightRevenue: 18_000 },
  corridorFixedAmount: 2_800,
  corridorName: "GDL → León",
};

describe("buildSampleWeekTrips", () => {
  it("no inventa CDMX→Monterrey cuando la tarifa no tiene rutas fijas", () => {
    const trips = buildSampleWeekTrips([]);
    expect(trips.every((trip) => trip.corridorFixedAmount == null)).toBe(true);
    expect(
      trips.some((trip) => /CDMX|Monterrey/i.test(trip.label)),
    ).toBe(false);
    expect(trips).toEqual(DEFAULT_SAMPLE_WEEK_TRIPS);
  });

  it("usa una ruta real y su monto cuando la tarifa tiene corredores", () => {
    const trips = buildSampleWeekTrips([
      {
        id: "c-1",
        name: "GDL → León",
        fixedAmount: 2_800,
        isActive: true,
      },
      {
        id: "c-2",
        name: "Otra",
        fixedAmount: 1_000,
        isActive: false,
      },
    ]);

    expect(trips[0]?.label).toBe("GDL → León");
    expect(trips[0]?.corridorFixedAmount).toBe(2_800);
    expect(trips[0]?.corridorName).toBe("GDL → León");
    expect(trips.slice(1)).toEqual(DEFAULT_SAMPLE_WEEK_TRIPS);
  });
});

describe("simulateCompensationWeek", () => {
  it("suma viajes vía simulateCompensation + fijos − descuentos una vez", () => {
    const week = simulateCompensationWeek(
      [ratePerKmRule, localRule],
      [
        {
          allowanceType: "meals",
          label: "Comidas",
          amount: 700,
          period: "weekly",
          isMandatory: true,
        },
      ],
      DEFAULT_SAMPLE_WEEK_TRIPS,
      [
        {
          deductionType: "savings_fund",
          label: "Fondo",
          amount: 350,
          period: "weekly",
          isMandatory: true,
        },
      ],
    );

    expect(week.lines.some((line) => line.group === "trips")).toBe(true);
    expect(week.allowancesTotal).toBe(700);
    expect(week.deductionsTotal).toBe(350);
    expect(week.total).toBe(
      Math.max(0, week.tripsTotal + week.allowancesTotal - week.deductionsTotal),
    );
  });

  it("respeta precedencia de corredor sobre regla por clase", () => {
    const week = simulateCompensationWeek(
      [ratePerKmRule],
      [],
      [corridorTrip],
      [],
    );
    const single = simulateCompensation(
      [ratePerKmRule],
      [],
      corridorTrip.input,
      corridorTrip.corridorFixedAmount,
      corridorTrip.corridorName,
      [],
    );
    expect(week.tripsTotal).toBe(single.gross);
    expect(week.lines[0]?.why).toMatch(/ruta con tarifa fija/i);
  });

  it("mantiene paridad de golden cases al simular un viaje suelto", () => {
    for (const goldenCase of COMMISSION_GOLDEN_CASES) {
      const rules: CompensationTemplateRule[] = goldenCase.rule
        ? [{ routeType: goldenCase.trip.routeType, ...goldenCase.rule }]
        : [];
      const result = simulateCompensation(rules, [], goldenCase.trip);
      expect(result.total).toBe(goldenCase.expected.amount);
    }
  });
});
