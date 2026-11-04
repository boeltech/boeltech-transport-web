import { useState } from "react";

/**
 * Prioridad de sugerencia al iniciar viaje (StartTripSheet / DeclareFalseTripSheet):
 * 1) start_mileage ya guardado en el viaje (canvas / confirmar reserva), incl. 0
 * 2) odómetro actual del vehículo solo si el viaje no tiene km
 */
export function resolveSuggestedStartMileage(
  vehicleCurrentMileage: number | undefined,
  tripStartMileage: number | null | undefined,
): number | undefined {
  if (
    typeof tripStartMileage === "number" &&
    Number.isFinite(tripStartMileage) &&
    tripStartMileage >= 0
  ) {
    return tripStartMileage;
  }

  if (
    typeof vehicleCurrentMileage === "number" &&
    Number.isFinite(vehicleCurrentMileage) &&
    vehicleCurrentMileage >= 0
  ) {
    return vehicleCurrentMileage;
  }

  return undefined;
}

/**
 * Sugerencia al cerrar viaje (llegada / completar):
 * km inicial + distancia total de tramos entre paradas.
 * Sin distancia planificada, cae al km inicial (el operador ajusta).
 */
export function resolveSuggestedEndMileage(
  tripStartMileage: number | null | undefined,
  totalDistanceKm: number | null | undefined,
): number | undefined {
  if (
    typeof tripStartMileage !== "number" ||
    !Number.isFinite(tripStartMileage) ||
    tripStartMileage < 0
  ) {
    return undefined;
  }

  if (
    typeof totalDistanceKm === "number" &&
    Number.isFinite(totalDistanceKm) &&
    totalDistanceKm > 0
  ) {
    return Math.round(tripStartMileage + totalDistanceKm);
  }

  return tripStartMileage;
}

/** Cierre con km final igual al de salida: 0 km recorridos (solo aviso, no bloquea). */
export function isZeroKmClose(
  tripStartMileage: number | null | undefined,
  endMileage: number | null,
): boolean {
  return (
    typeof tripStartMileage === "number" &&
    Number.isFinite(tripStartMileage) &&
    endMileage !== null &&
    endMileage === tripStartMileage
  );
}

export function parseStartMileageInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * Campo de odómetro con sugerencia del vehículo/viaje sin sincronizar en useEffect.
 * Montar con `key` al abrir/cerrar el diálogo para reiniciar estado local.
 */
export function useSuggestedMileageField(suggestedMileage: number | undefined) {
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);

  const value =
    !touched && suggestedMileage !== undefined
      ? String(suggestedMileage)
      : draft;

  return {
    value,
    onValueChange: (next: string) => {
      setTouched(true);
      setDraft(next);
    },
    parseValue: () => parseStartMileageInput(value),
  };
}
