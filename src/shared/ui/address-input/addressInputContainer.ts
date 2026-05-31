import { cn } from "@shared/lib/utils/cn";

/** Contenedor visual compartido de `AddressInput` y secciones hermanas (p. ej. Confirmación Geográfica). */
export const ADDRESS_INPUT_CONTAINER_CLASS = "space-y-4 rounded-lg border p-4";

export function addressInputContainerClass(disabled?: boolean): string {
  return cn(ADDRESS_INPUT_CONTAINER_CLASS, disabled && "opacity-70");
}
