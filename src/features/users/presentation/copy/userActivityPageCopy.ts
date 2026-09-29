/**
 * Namespace: users.copy.activity.*
 *
 * Copy del historial de usuarios: página `/users/activity` y tarjeta del detalle.
 * Léxico operativo: nada de «tenant», «auditoría», «estatus» ni códigos del API.
 * Las frases de cada evento viven en `../helpers/userActivityCopy.ts`.
 */

export interface UserActivityActionOption {
  readonly value: string;
  readonly label: string;
}

export interface UserActivityActionGroup {
  readonly label: string;
  readonly options: readonly UserActivityActionOption[];
}

/** Opciones del filtro «Tipo de cambio». Cada valor se envía tal cual al API. */
export const USER_ACTIVITY_ACTION_GROUPS: readonly UserActivityActionGroup[] = [
  {
    label: "Altas y bajas",
    options: [
      { value: "user_created", label: "Alta de usuario" },
      { value: "status_changed", label: "Baja, suspensión o reactivación" },
    ],
  },
  {
    label: "Datos y permisos",
    options: [{ value: "user_updated", label: "Cambio de datos o de rol" }],
  },
  {
    label: "Invitaciones",
    options: [
      { value: "invitation_sent", label: "Invitación enviada" },
      { value: "invitation_resent", label: "Invitación reenviada" },
      { value: "invitation_cancelled", label: "Invitación cancelada" },
    ],
  },
  {
    label: "Contraseñas y primer acceso",
    options: [
      { value: "password_changed_self", label: "Cambio de contraseña" },
      { value: "onboarding_completed_product", label: "Guía de primer uso completada" },
    ],
  },
];

export function findUserActivityActionLabel(value: string): string {
  for (const group of USER_ACTIVITY_ACTION_GROUPS) {
    const option = group.options.find((item) => item.value === value);
    if (option) return option.label;
  }
  return "Otro cambio";
}

export const userActivityPageCopy = {
  page: {
    title: "Historial de usuarios",
    description:
      "Quién creó, editó o dio de baja cuentas de tu equipo, y cuándo.",
    entityLabelPlural: "movimientos",
    errorTitle: "No se pudo mostrar el historial",
    error: "No se pudo cargar el historial de usuarios.",
    retry: "Reintentar",
  },
  filters: {
    showFilters: "Filtros",
    periodPlaceholder: "Periodo",
    periodHeading: "Periodo del historial",
    actionLabel: "Tipo de cambio",
    actionAll: "Todos los cambios",
    personLabel: "Persona afectada",
    personAll: "Todas las personas",
    actorLabel: "Quién hizo el cambio",
    actorAll: "Cualquiera",
    clearRecortes: "Limpiar filtros",
    viewAllHistory: "Ver todo el historial",
    chip: {
      action: (label: string) => `Cambio: ${label}`,
      person: (name: string) => `Persona: ${name}`,
      actor: (name: string) => `Hecho por: ${name}`,
    },
    unknownPerson: "Cuenta eliminada",
  },
  groups: {
    today: "Hoy",
    yesterday: "Ayer",
    undated: "Sin fecha",
    count: (total: number) =>
      `${total} movimiento${total === 1 ? "" : "s"}`,
  },
  empty: {
    virginTitle: "Todavía no hay movimientos",
    virginDescription:
      "Aquí verás las altas, los cambios de rol, las invitaciones y las bajas de las cuentas de tu equipo.",
    windowTitle: "No hay movimientos en este periodo",
    windowDescription:
      "Prueba con otro periodo o quítalo para ver todo el historial.",
    recorteTitle: "Ningún movimiento con estos filtros",
    recorteDescription:
      "Quita los filtros o prueba con otro tipo de cambio, persona o periodo.",
  },
  card: {
    title: "Historial de esta cuenta",
    fullHistory: "Ver historial completo",
    loading: "Cargando…",
    error: "No se pudo cargar el historial de esta cuenta.",
    empty:
      "Todavía no hay movimientos en esta cuenta. Aquí verás su alta, los cambios de rol y las invitaciones.",
    loadMore: "Ver más",
    loadingMore: "Cargando…",
    refresh: "Actualizar",
    refreshing: "Actualizando…",
    showing: (shown: number, total: number) =>
      shown === total
        ? `${total} movimiento${total === 1 ? "" : "s"} en total.`
        : `Mostrando ${shown} de ${total} movimientos.`,
  },
} as const;
