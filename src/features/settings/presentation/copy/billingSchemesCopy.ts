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
    selectPrompt: "Selecciona un esquema o crea uno nuevo.",
  },
  cadence: {
    event: "Por cierre de viaje",
    periodic_weekly: "Semanal",
    periodic_decadal: "Cortes del mes",
    periodic_monthly: "Mensual",
  } satisfies Record<BillingCadenceKind, string>,
  weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const,
  form: {
    createTitle: "Nuevo esquema",
    editTitle: "Editar esquema",
    name: "Nombre",
    nameHint: "Ej. Corte semanal jueves–viernes",
    cadence: "Frecuencia de envío",
    cadenceHint: "Cuándo se agrupa el correo con las facturas listas del periodo.",
    isDefault: "Esquema predeterminado",
    isDefaultHint:
      "Se ofrece por defecto al asignar clientes (o si el cliente no tiene esquema). Solo uno activo puede serlo.",
    params: {
      windowHours: "Horas después de cerrar el viaje",
      windowHoursHint:
        "Ventana hacia atrás desde el cierre operativo del viaje.",
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
    deactivate: "Desactivar",
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
