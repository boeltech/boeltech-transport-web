import {

  TRIP_EXPENSE_POST_CLOSE_WINDOW_DAYS,

  canAppendTripCargo,

  canAppendTripStops,

  canCreateTripExpense,

  canEditTrip,

  canManageTripExpenses,

  canMutatePendingTripExpense,

  canMutateTripBaseRate,

  canReassignTripFleet,

  canReplanPendingTripStops,

  isTripExpensePostCloseWindowOpen,

  type TripStatusType,

} from "@features/trips";

import { ROLES, type UserRole } from "@shared/constants/roles";



/** Roles con CTA de alta post-cierre visible (PD-E; UI-only). */

const POST_CLOSE_EXPENSE_CREATE_ROLES = new Set<UserRole>([

  ROLES.ADMIN,

  ROLES.MANAGER,

  ROLES.ACCOUNTANT,

]);



export interface TripDetailAccessPermissions {

  canUpdateTrip: boolean;

  canCreateExpense: boolean;

  canUpdateExpense: boolean;

  canDeleteExpense: boolean;

  /** Instantánea de cierre (`trip.actualArrival`). */

  closedAt?: Date | string | null;

  now?: Date | string;

  /**

   * Rol del usuario para gates UI (PD-E: ocultar CTA alta a operator post-cierre).

   * No sustituye RBAC API.

   */

  role?: UserRole | string | null;

}



export interface TripDetailAccess {

  canEditStructural: boolean;

  /** ADR-0093 PD1 — independiente de structural. */

  canEditBaseRate: boolean;

  /**
   * Clase de ruta (`route_type`): editable con trips.update hasta paid_lock (CEO-1).
   * El API responde 409 si ya hay liquidación pagada.
   */
  canEditRouteType: boolean;

  canAppendCargo: boolean;

  /**

   * ADR-0093 E1 — gate principal mid-trip de ruta (replan pending).

   */

  canReplanPendingStops: boolean;

  /**

   * @deprecated E1 — path de producto mid-trip = {@link canReplanPendingStops}.

   * Se mantiene por compat; no usar como gate de Tab Ruta.

   */

  canAppendStops: boolean;

  canReassignFleet: boolean;

  /** Alta de gastos (pre-cierre vía trips.update; post-cierre vía expenses.create + ventana). */

  canCreateExpenses: boolean;

  /**
   * Gate de página para editar gastos (RBAC + estado/ventana del viaje).
   * La UI reevalúa cada gasto con su estado (`canMutatePendingTripExpense`).
   */

  canUpdatePendingExpenses: boolean;

  /** Eliminar gastos pendientes: `expenses.delete` (pre- y post-cierre). */

  canDeletePendingExpenses: boolean;

  /**
   * ADR-0099 TEC-5: gate para corregir un gasto devuelto (sin ventana
   * post-cierre). La fila lo reevalúa con `returnedForCorrection`.
   */
  canUpdateReturnedExpenses: boolean;

  canDeleteReturnedExpenses: boolean;

  /**

   * Compat: hay alguna mutación de gastos habilitada.

   * @deprecated Prefer canCreateExpenses / canUpdatePendingExpenses / canDeletePendingExpenses.

   */

  canManageExpenses: boolean;

  /** Viaje completed y ventana post-cierre abierta. */

  expenseWindowOpen: boolean;

  /** Viaje completed y ventana ya cerrada (o sin closedAt). */

  expenseWindowClosed: boolean;

  /** Límite superior de la ventana (closedAt + 30d), si aplica. */

  expenseWindowClosesAt: Date | null;

}



function toDate(value: Date | string | null | undefined): Date | null {

  if (value == null) return null;

  const date = typeof value === "string" ? new Date(value) : value;

  return Number.isNaN(date.getTime()) ? null : date;

}



function computeWindowClosesAt(

  closedAt: Date | string | null | undefined,

): Date | null {

  const closed = toDate(closedAt);

  if (!closed) return null;

  const deadline = new Date(closed.getTime());

  deadline.setUTCDate(deadline.getUTCDate() + TRIP_EXPENSE_POST_CLOSE_WINDOW_DAYS);

  return deadline;

}



function allowsPostCloseExpenseCreateUi(

  role: UserRole | string | null | undefined,

): boolean {

  if (role == null) return false;

  return POST_CLOSE_EXPENSE_CREATE_ROLES.has(role as UserRole);

}



export function getTripDetailAccess(

  status: TripStatusType | undefined,

  permissions: TripDetailAccessPermissions | boolean,

): TripDetailAccess {

  const empty: TripDetailAccess = {

    canEditStructural: false,

    canEditBaseRate: false,

    canEditRouteType: false,

    canAppendCargo: false,

    canReplanPendingStops: false,

    canAppendStops: false,

    canReassignFleet: false,

    canCreateExpenses: false,

    canUpdatePendingExpenses: false,

    canDeletePendingExpenses: false,

    canUpdateReturnedExpenses: false,

    canDeleteReturnedExpenses: false,

    canManageExpenses: false,

    expenseWindowOpen: false,

    expenseWindowClosed: false,

    expenseWindowClosesAt: null,

  };



  if (!status) return empty;



  // Compat firma antigua: getTripDetailAccess(status, canUpdateTrip: boolean)

  const perms: TripDetailAccessPermissions =

    typeof permissions === "boolean"

      ? {

          canUpdateTrip: permissions,

          canCreateExpense: permissions,

          canUpdateExpense: permissions,

          canDeleteExpense: permissions,

        }

      : permissions;



  const closedAt = perms.closedAt ?? null;

  const now = perms.now;

  const windowClosesAt = computeWindowClosesAt(closedAt);

  const isCompleted = status === "completed";

  const expenseWindowOpen =

    isCompleted && isTripExpensePostCloseWindowOpen(closedAt, now);

  const expenseWindowClosed = isCompleted && !expenseWindowOpen;



  const canEditStructural = perms.canUpdateTrip && canEditTrip(status);

  const canEditBaseRate = perms.canUpdateTrip && canMutateTripBaseRate(status);

  /** Hasta paid_lock (gate en API); UI muestra editor y maneja 409. */
  const canEditRouteType = perms.canUpdateTrip;

  const canAppendCargo = perms.canUpdateTrip && canAppendTripCargo(status);

  const canReplanPendingStops =

    perms.canUpdateTrip && canReplanPendingTripStops(status);

  /** @deprecated Compat — no gate de Tab Ruta mid-trip. */

  const canAppendStops = perms.canUpdateTrip && canAppendTripStops(status);

  const canReassignFleet = perms.canUpdateTrip && canReassignTripFleet(status);



  let canCreateExpenses = false;

  let canUpdatePendingExpenses = false;

  let canDeletePendingExpenses = false;

  let canUpdateReturnedExpenses = false;

  let canDeleteReturnedExpenses = false;



  if (canManageTripExpenses(status)) {

    // Pre-cierre: alta/edición = trips.update; eliminar = expenses.delete (D9).

    const openGate = perms.canUpdateTrip;

    canCreateExpenses = openGate;

    canUpdatePendingExpenses = openGate;

    canDeletePendingExpenses = perms.canDeleteExpense;

    canUpdateReturnedExpenses = canUpdatePendingExpenses;

    canDeleteReturnedExpenses = canDeletePendingExpenses;

  } else if (isCompleted) {

    const domainCreate = canCreateTripExpense({

      status,

      closedAt,

      now,

    });

    // Gate de página en el mejor caso (`pending`); cada fila se reevalúa con su estado real.
    const domainMutatePending = canMutatePendingTripExpense({

      status,

      expenseStatus: "pending",

      closedAt,

      now,

    });

    canCreateExpenses =

      perms.canCreateExpense &&

      domainCreate &&

      allowsPostCloseExpenseCreateUi(perms.role);

    canUpdatePendingExpenses = perms.canUpdateExpense && domainMutatePending;

    canDeletePendingExpenses = perms.canDeleteExpense && domainMutatePending;

    const domainMutateReturned = canMutatePendingTripExpense({
      status,
      expenseStatus: "pending",
      closedAt,
      now,
      returnedForCorrection: true,
    });

    canUpdateReturnedExpenses = perms.canUpdateExpense && domainMutateReturned;

    canDeleteReturnedExpenses = perms.canDeleteExpense && domainMutateReturned;

  }



  const canManageExpenses =

    canCreateExpenses || canUpdatePendingExpenses || canDeletePendingExpenses;



  return {

    canEditStructural,

    canEditBaseRate,

    canEditRouteType,

    canAppendCargo,

    canReplanPendingStops,

    canAppendStops,

    canReassignFleet,

    canCreateExpenses,

    canUpdatePendingExpenses,

    canDeletePendingExpenses,

    canUpdateReturnedExpenses,

    canDeleteReturnedExpenses,

    canManageExpenses,

    expenseWindowOpen,

    expenseWindowClosed,

    expenseWindowClosesAt: windowClosesAt,

  };

}


