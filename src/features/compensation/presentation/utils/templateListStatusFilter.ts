import type { CompensationTemplateListQuery } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";

const filterCopy = compensationCopy.templates.filters;

/**
 * Filtro «Estado» del listado de tarifas. `current` («Vigentes») es el valor por defecto y
 * nunca va en la URL; `all` sí (`?status=all`) porque «Todos los estados» ya no es el default.
 * `inactive` solo existe para enlaces viejos (`?status=inactive`).
 */
export type TemplateListStatusFilter =
  | "current"
  | "active"
  | "draft"
  | "superseded"
  | "deactivated"
  | "all"
  | "inactive";

/** Opciones visibles del selector, en orden; `inactive` solo se muestra mientras está activo. */
export const TEMPLATE_LIST_STATUS_OPTIONS = [
  "current",
  "active",
  "draft",
  "superseded",
  "deactivated",
  "all",
] as const satisfies readonly TemplateListStatusFilter[];

const URL_VALUES: ReadonlySet<string> = new Set<TemplateListStatusFilter>([
  "active",
  "draft",
  "superseded",
  "deactivated",
  "all",
  "inactive",
]);

/** `?status=` → filtro. Sin parámetro o con un valor desconocido = «Vigentes». */
export function parseTemplateListStatusFilter(
  raw: string | null | undefined,
): TemplateListStatusFilter {
  const value = raw?.trim() ?? "";
  return URL_VALUES.has(value) ? (value as TemplateListStatusFilter) : "current";
}

/** Filtro → valor de `?status=`; `""` = quitar el parámetro. */
export function templateListStatusFilterToUrl(filter: TemplateListStatusFilter): string {
  return filter === "current" ? "" : filter;
}

type TemplateListStatusQuery = Pick<
  CompensationTemplateListQuery,
  "groupBy" | "scope" | "status" | "inactiveReason"
>;

/** Filtro → parámetros del API. Siempre agrupa por familia; «Todos» no manda `status` ni `scope`. */
export function templateListStatusFilterToQuery(
  filter: TemplateListStatusFilter,
): TemplateListStatusQuery {
  switch (filter) {
    case "current":
      return { groupBy: "family", scope: "current" };
    case "active":
      return { groupBy: "family", status: "active" };
    case "draft":
      return { groupBy: "family", status: "draft" };
    case "superseded":
      return { groupBy: "family", status: "inactive", inactiveReason: "superseded" };
    case "deactivated":
      return { groupBy: "family", status: "inactive", inactiveReason: "manual" };
    case "inactive":
      return { groupBy: "family", status: "inactive" };
    case "all":
      return { groupBy: "family" };
  }
}

const LABELS: Record<TemplateListStatusFilter, string> = {
  current: filterCopy.current,
  active: filterCopy.active,
  draft: filterCopy.draft,
  superseded: filterCopy.superseded,
  deactivated: filterCopy.deactivated,
  all: filterCopy.all,
  inactive: filterCopy.inactive,
};

export function templateListStatusFilterLabel(filter: TemplateListStatusFilter): string {
  return LABELS[filter];
}
