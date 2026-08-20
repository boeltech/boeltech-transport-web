import type {
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";

/**
 * Writes latitude + longitude as a pair, then validates both fields together.
 *
 * Sequential `setValue(..., { shouldValidate: true })` races RHF/Zod: the first
 * pass sees only one coordinate and leaves "deben informarse juntas" on latitude
 * even after the second value is applied.
 */
export function setFormCoordinates<TFieldValues extends FieldValues>(
  setValue: UseFormSetValue<TFieldValues>,
  trigger: UseFormTrigger<TFieldValues>,
  coords: { latitude: number; longitude: number },
  namePrefix?: string,
): Promise<boolean> {
  const latName = (namePrefix
    ? `${namePrefix}.latitude`
    : "latitude") as Path<TFieldValues>;
  const lngName = (namePrefix
    ? `${namePrefix}.longitude`
    : "longitude") as Path<TFieldValues>;

  setValue(latName, coords.latitude as PathValue<TFieldValues, typeof latName>, {
    shouldDirty: true,
    shouldValidate: false,
  });
  setValue(
    lngName,
    coords.longitude as PathValue<TFieldValues, typeof lngName>,
    {
      shouldDirty: true,
      shouldValidate: false,
    },
  );
  return trigger([latName, lngName]);
}
