/**
 * Cobertura de entregas vs total de la mercancía (F7 / QC-ENT-1).
 *
 * Soft under-allocation solo con ≥1 delivery explícito.
 * 0 deliveries → `n/a` (F5a implícito; no disparar falso faltante).
 * Exceso → `over` (sigue bloqueando en UI).
 */

export type CargoDeliveryQty = {
  readonly weight?: number | null;
  readonly units?: number | null;
};

export type CargoDeliveryCoverageResult =
  | { readonly status: "n/a" }
  | {
      readonly status: "ok";
      readonly allocatedWeight: number;
      readonly allocatedUnits: number;
    }
  | {
      readonly status: "under";
      readonly pendingWeight: number | null;
      readonly pendingUnits: number | null;
      readonly allocatedWeight: number;
      readonly allocatedUnits: number;
      readonly cargoWeight: number | null;
      readonly cargoUnits: number | null;
    }
  | {
      readonly status: "over";
      readonly excessWeight: number | null;
      readonly excessUnits: number | null;
      readonly allocatedWeight: number;
      readonly allocatedUnits: number;
      readonly cargoWeight: number | null;
      readonly cargoUnits: number | null;
    };

function positiveOrNull(value: number | null | undefined): number | null {
  return value != null && value > 0 ? value : null;
}

/**
 * Compara suma de entregas explícitas contra totales de la mercancía.
 * Dimensiones con total ≤0 / null no se evalúan.
 */
export function computeCargoDeliveryCoverage(args: {
  cargoWeightKg?: number | null;
  cargoUnits?: number | null;
  deliveries: readonly CargoDeliveryQty[];
}): CargoDeliveryCoverageResult {
  const { deliveries } = args;
  if (deliveries.length === 0) {
    return { status: "n/a" };
  }

  const allocatedWeight = deliveries.reduce(
    (sum, delivery) => sum + (delivery.weight ?? 0),
    0,
  );
  const allocatedUnits = deliveries.reduce(
    (sum, delivery) => sum + (delivery.units ?? 0),
    0,
  );

  const cargoWeight = positiveOrNull(args.cargoWeightKg);
  const cargoUnits = positiveOrNull(args.cargoUnits);

  if (cargoWeight == null && cargoUnits == null) {
    return { status: "ok", allocatedWeight, allocatedUnits };
  }

  const excessWeight =
    cargoWeight != null && allocatedWeight > cargoWeight
      ? allocatedWeight - cargoWeight
      : null;
  const excessUnits =
    cargoUnits != null && allocatedUnits > cargoUnits
      ? allocatedUnits - cargoUnits
      : null;

  if (excessWeight != null || excessUnits != null) {
    return {
      status: "over",
      excessWeight,
      excessUnits,
      allocatedWeight,
      allocatedUnits,
      cargoWeight,
      cargoUnits,
    };
  }

  const pendingWeight =
    cargoWeight != null && allocatedWeight < cargoWeight
      ? cargoWeight - allocatedWeight
      : null;
  const pendingUnits =
    cargoUnits != null && allocatedUnits < cargoUnits
      ? cargoUnits - allocatedUnits
      : null;

  if (pendingWeight != null || pendingUnits != null) {
    return {
      status: "under",
      pendingWeight,
      pendingUnits,
      allocatedWeight,
      allocatedUnits,
      cargoWeight,
      cargoUnits,
    };
  }

  return { status: "ok", allocatedWeight, allocatedUnits };
}

/** Partes legibles del remanente («11,000 kg», «11 uds»). */
export function formatDeliveryRemainderParts(
  pendingWeight: number | null | undefined,
  pendingUnits: number | null | undefined,
): string[] {
  const parts: string[] = [];
  if (pendingWeight != null && pendingWeight > 0) {
    parts.push(`${pendingWeight.toLocaleString("es-MX")} kg`);
  }
  if (pendingUnits != null && pendingUnits > 0) {
    parts.push(`${pendingUnits.toLocaleString("es-MX")} uds`);
  }
  return parts;
}

/** «11,000 kg / 11 uds» o cadena vacía si no hay remanente. */
export function formatDeliveryRemainderLine(
  pendingWeight: number | null | undefined,
  pendingUnits: number | null | undefined,
): string {
  return formatDeliveryRemainderParts(pendingWeight, pendingUnits).join(" / ");
}

function isEmptyDeliveryQty(value: number | null | undefined): boolean {
  return value == null || value <= 0;
}

/**
 * D-F7-8: con exactamente 1 delivery y qty vacía (peso y uds), hereda los
 * totales de la mercancía. Con ≥2 deliveries no hereda (soft F7).
 * No pisa qty ya explícita (p. ej. under intencional 1:1).
 */
export function applySingleDeliveryQtyInherit<T extends CargoDeliveryQty>(args: {
  cargoWeightKg?: number | null;
  cargoUnits?: number | null;
  deliveries: readonly T[];
}): T[] {
  const { deliveries } = args;
  if (deliveries.length !== 1) {
    return deliveries.map((delivery) => ({ ...delivery }));
  }

  const delivery = deliveries[0]!;
  if (
    !isEmptyDeliveryQty(delivery.weight) ||
    !isEmptyDeliveryQty(delivery.units)
  ) {
    return [{ ...delivery }];
  }

  const cargoWeight = positiveOrNull(args.cargoWeightKg);
  const cargoUnits = positiveOrNull(args.cargoUnits);
  if (cargoWeight == null && cargoUnits == null) {
    return [{ ...delivery }];
  }

  return [
    {
      ...delivery,
      ...(cargoWeight != null ? { weight: cargoWeight } : {}),
      ...(cargoUnits != null ? { units: cargoUnits } : {}),
    },
  ];
}

/** Normaliza qty de movement para comparar / PATCH (≤0 → null). */
export function normalizeMovementQty(
  value: number | null | undefined,
): number | null {
  return value != null && value > 0 ? value : null;
}
