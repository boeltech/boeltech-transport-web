import type { BillingCadenceKind } from "../../domain/billingScheme.types";

export const billingSchemesCopy = {
  page: {
    title: "Esquemas de facturación",
    description:
      "Define cuándo agrupar el envío por correo de facturas ya listas. No genera facturas. Sin esquema, el cliente sigue en Por facturar.",
  },
  list: {
    title: "Esquemas",
    add: "Nuevo esquema",
    emptyTitle: "Sin esquemas configurados",
    emptyDescription:
      "Crea un esquema para definir cuándo agrupar el envío por cliente.",
    loading: "Cargando esquemas…",
    defaultBadge: "Predeterminado",
    inactiveBadge: "Inactivo",
    selectPrompt: "Selecciona un esquema de la lista para ver su detalle.",
  },
  cadence: {
    event: "Por cierre de viaje",
    periodic_weekly: "Semanal",
    periodic_decadal: "Cortes del mes",
    periodic_monthly: "Mensual",
  } satisfies Record<BillingCadenceKind, string>,
  weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const,
  naturalDescription: {
    event: (hours: number) =>
      `Cuando un viaje se cierra, sus facturas listas pueden incluirse en un envío hasta ${hours} horas después del cierre.`,
    weekly: (weekdays: number[]) => {
      const days = weekdays
        .map((d) => billingSchemesCopy.weekdays[d] ?? d)
        .join(" y ");
      return `Cada ${days} se agrupan las facturas listas de los viajes cerrados en el periodo y se preparan para envío por correo.`;
    },
    decadal: (monthDays: number[]) =>
      `Los días ${monthDays.join(", ")} de cada mes se prepara el envío con las facturas listas del periodo.`,
    monthlyDays: (monthDays: number[]) =>
      `Los días ${monthDays.join(", ")} de cada mes se prepara el envío con las facturas listas del periodo.`,
    monthlyBusiness: (n: number) =>
      `El ${n}.º día hábil de cada mes se prepara el envío con las facturas listas del periodo.`,
    fallback:
      "Define cuándo se prepara el envío por correo con las facturas ya listas del periodo.",
  },
  detail: {
    summaryTitle: "Resumen",
    periodRuleTitle: "Regla del periodo",
    assignmentTitle: "Al asignar a un cliente",
    assignmentBody:
      "El cliente puede entrar a envíos programados de este esquema. Sin esquema asignado, solo aparece en Por facturar.",
    clientsCta: "Ir a clientes",
    detailsTitle: "Detalles",
    createdAt: (label: string) => `Creado: ${label}`,
    updatedAt: (label: string) => `Última actualización: ${label}`,
    edit: "Editar esquema",
    deactivate: "Desactivar",
    periodRules: {
      frequency: (label: string) => `Frecuencia: ${label}`,
      windowHours: (hours: number) =>
        `Espera tras cierre del viaje: ${hours} horas`,
      weekdays: (days: string) => `Días de corte: ${days}`,
      monthDays: (days: string) => `Días de corte del mes: ${days}`,
      businessDays: (n: number) =>
        `Día hábil del mes: ${n}.º desde inicio de mes`,
      tripInclusion:
        "Viajes incluidos: cerrados en el periodo (fecha de cierre operativo del viaje)",
    },
  },
  form: {
    createTitle: "Nuevo esquema",
    editTitle: "Editar esquema",
    name: "Nombre",
    nameHint: "Ej. Corte semanal jueves–viernes",
    cadence: "¿Con qué frecuencia se prepara el envío?",
    cadenceHint: "Cuándo se agrupa el correo con las facturas listas del periodo.",
    isDefault: "Esquema predeterminado",
    isDefaultHint:
      "Se ofrece por defecto al asignar clientes (o si el cliente no tiene esquema). Solo uno activo puede serlo.",
    params: {
      windowHours: "Horas después de cerrar el viaje",
      windowHoursHint:
        "Se cuentan los viajes cerrados en las últimas horas antes del envío.",
      weekdays: "Días de corte",
      monthDays: "Días de corte del mes",
      monthDaysHint: "Ej. 10, 20, 30. Números del 1 al 31, separados por coma.",
      businessDays: "N.º día hábil del mes",
      businessDaysHint: "Ej. 3 = tercer día hábil desde el inicio de mes.",
      monthlyMode: "Tipo de corte mensual",
      monthlyByDays: "Por días calendario",
      monthlyByBusiness: "Por día hábil",
    },
    save: "Guardar",
    cancel: "Cancelar",
    validation: {
      nameRequired: "Indica un nombre para el esquema",
      windowHoursRequired: "Indica las horas tras cerrar el viaje",
      weekdaysRequired: "Selecciona al menos un día de corte",
      monthDaysRequired: "Indica al menos un día de corte del mes",
      businessDaysRequired: "Indica el día hábil (1–15)",
    },
  },
  delete: {
    title: "Desactivar esquema",
    description:
      "El esquema dejará de estar disponible para nuevos envíos programados. Los clientes asignados conservan la referencia hasta que lo cambies.",
    confirm: "Desactivar",
    cancel: "Cancelar",
  },
  toast: {
    created: "Esquema creado",
    updated: "Esquema actualizado",
    deleted: "Esquema desactivado",
    error: "No se pudo guardar el esquema",
  },
  paramsSummary: {
    event: (hours: number) => `${hours} h tras cerrar viaje`,
    weekly: (days: number[]) =>
      days
        .map((d) => billingSchemesCopy.weekdays[d] ?? d)
        .join(", "),
    monthDays: (days: number[]) => `Días ${days.join(", ")}`,
    businessDays: (n: number) => `${n}.º día hábil del mes`,
  },
} as const;
