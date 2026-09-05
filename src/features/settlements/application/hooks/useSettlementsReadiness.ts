import type { HubReadinessItem } from "@shared/ui/page-shells";
import { getTodayString } from "@shared/utils/dateUtils";
import { useEmployees } from "@features/employees";
import {
  COMPENSATION_TEMPLATES_PATH,
  compensationTemplateOperatorsPath,
} from "@features/compensation/application/compensationRoutes";
import {
  useCompensationTemplates,
  useTemplateAssignments,
} from "@features/compensation/application/hooks";
import { TripStatus, useTrips } from "@features/trips";
import { settlementsCopy } from "../../presentation/copy/settlementsCopy";

const copy = settlementsCopy.workbench.readiness;

/**
 * Sin endpoint liviano de `baseSalary > 0`: usamos empleados activos como
 * señal de descubrimiento (CTA a Empleados). No inventar API.
 */
export const SETTLEMENTS_READINESS_PROBE_PAGE_SIZE = 1;

export interface SettlementsReadiness {
  items: HubReadinessItem[];
  isReady: boolean;
  isLoading: boolean;
}

export interface BuildSettlementsReadinessInput {
  /** Proxy: empleados activos (listado no expone baseSalary). */
  employeesTotal: number;
  templatesTotal: number;
  assignmentsTotal: number;
  /** undefined = sin señal de viajes (omitir chip). */
  completedTripsTotal?: number;
  firstTemplateId?: string;
}

/**
 * Deriva chips de readiness (cero React).
 * Cutover: esquemas activos ≥ 1 ∧ asignaciones vigentes ≥ 1.
 * Empleados y viajes son señales de descubrimiento (no bloquean isReady).
 */
export function buildSettlementsReadinessItems(
  input: BuildSettlementsReadinessInput,
): { items: HubReadinessItem[]; isReady: boolean } {
  const templatesActive = input.templatesTotal;
  const assignmentsActive = input.assignmentsTotal;
  const employeesActive = input.employeesTotal;
  const assignmentsHref =
    input.firstTemplateId != null
      ? compensationTemplateOperatorsPath(input.firstTemplateId)
      : COMPENSATION_TEMPLATES_PATH;

  const items: HubReadinessItem[] = [
    {
      id: "operators_salary",
      label: copy.operatorsSalaryLabel,
      value: employeesActive,
      status: employeesActive >= 1 ? "info" : "empty",
      href: "/employees",
    },
    {
      id: "templates_active",
      label: copy.templatesActiveLabel,
      value: templatesActive,
      status: templatesActive >= 1 ? "ok" : "empty",
      href: COMPENSATION_TEMPLATES_PATH,
    },
    {
      id: "assignments_active",
      label: copy.assignmentsActiveLabel,
      value: assignmentsActive,
      status: assignmentsActive >= 1 ? "ok" : "empty",
      href: assignmentsHref,
    },
  ];

  if (input.completedTripsTotal !== undefined) {
    items.push({
      id: "trips_completed",
      label: copy.tripsCompletedLabel,
      value: input.completedTripsTotal,
      status: input.completedTripsTotal >= 1 ? "ok" : "info",
      href: "/trips",
    });
  }

  const isReady = templatesActive >= 1 && assignmentsActive >= 1;

  return { items, isReady };
}

export function useSettlementsReadiness(): SettlementsReadiness {
  const today = getTodayString();

  const employeesQuery = useEmployees({
    isActive: true,
    page: 1,
    limit: SETTLEMENTS_READINESS_PROBE_PAGE_SIZE,
  });

  const templatesQuery = useCompensationTemplates({
    isActive: true,
    page: 1,
    pageSize: SETTLEMENTS_READINESS_PROBE_PAGE_SIZE,
  });

  const assignmentsQuery = useTemplateAssignments({
    activeOn: today,
    page: 1,
    pageSize: SETTLEMENTS_READINESS_PROBE_PAGE_SIZE,
  });

  const tripsQuery = useTrips({
    filters: { status: TripStatus.COMPLETED },
    page: 1,
    limit: SETTLEMENTS_READINESS_PROBE_PAGE_SIZE,
  });

  const employeesTotal =
    employeesQuery.data?.pagination?.total ??
    employeesQuery.data?.data?.length ??
    0;
  const templatesTotal =
    templatesQuery.data?.pagination?.total ??
    templatesQuery.data?.data?.length ??
    0;
  const assignmentsTotal =
    assignmentsQuery.data?.pagination?.total ??
    assignmentsQuery.data?.data?.length ??
    0;
  const firstTemplateId = templatesQuery.data?.data?.[0]?.id;
  const completedTripsTotal = tripsQuery.isError
    ? undefined
    : (tripsQuery.data?.pagination?.total ??
      tripsQuery.data?.data?.length ??
      0);

  const { items, isReady } = buildSettlementsReadinessItems({
    employeesTotal,
    templatesTotal,
    assignmentsTotal,
    completedTripsTotal,
    firstTemplateId,
  });

  const isLoading =
    employeesQuery.isLoading ||
    templatesQuery.isLoading ||
    assignmentsQuery.isLoading ||
    tripsQuery.isLoading;

  return { items, isReady, isLoading };
}
