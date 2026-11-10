import { describe, expect, it } from "vitest";
import {
  DEFAULT_SAMPLE_WEEK_TRIPS,
  simulateCompensation,
  simulateCompensationWeek,
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
      DEFAULT_SAMPLE_WEEK_TRIPS.filter((trip) => !trip.corridorFixedAmount),
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
    const corridorTrip = DEFAULT_SAMPLE_WEEK_TRIPS[0]!;
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
