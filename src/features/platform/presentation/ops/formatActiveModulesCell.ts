import { opsCopy } from "./opsCopy";

/** URL search param for deep-link filter from catálogo → listado. */
export const TENANTS_MODULE_FILTER_PARAM = "module";

/** Columna Complementos: conteo + hasta 2 nombres (PRD P1). */
export function formatActiveModulesCell(
  count: number,
  codes: string[],
  resolveName: (code: string) => string,
): string {
  if (count <= 0) return opsCopy.tenants.modulesEmpty;
  const shown = codes.slice(0, 2).map(resolveName);
  const names = shown.join(", ");
  const base = opsCopy.tenants.modulesCell(count, names);
  if (count <= 2) return base;
  return `${base}${opsCopy.tenants.modulesMore(count - 2)}`;
}
