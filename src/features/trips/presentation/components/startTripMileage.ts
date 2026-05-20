import { useState } from "react";

/**
 * Prioridad de sugerencia al iniciar viaje:
 * 1) odómetro actual del vehículo
 * 2) start_mileage ya guardado en el viaje (p. ej. desde el wizard)
 */
export function resolveSuggestedStartMileage(
  vehicleCurrentMileage: number | undefined,
  tripStartMileage: number | null | undefined,
): number | undefined {
  if (
    typeof vehicleCurrentMileage === "number" &&
    Number.isFinite(vehicleCurrentMileage) &&
    vehicleCurrentMileage >= 0
  ) {
    return vehicleCurrentMileage;
  }

  if (
    typeof tripStartMileage === "number" &&
    Number.isFinite(tripStartMileage) &&
    tripStartMileage >= 0
  ) {
    return tripStartMileage;
  }

  return undefined;
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
