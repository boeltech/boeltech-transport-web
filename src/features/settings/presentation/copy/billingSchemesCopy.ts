import type { BillingCadenceKind } from "../../domain/billingScheme.types";

/**
 * Copy patio — capa A Configuración (frecuencias de envío).
 * Glosario PRD/DOM: al vuelo / semanal / cortes del mes / mensual.
 * Sin jerga `billing_scheme` / «esquema de facturación» en chrome.
 */
export const billingSchemesCopy = {
  page: {
    title: "Frecuencias de envío",
    description:
      "Aquí defines el ritmo con el que se agrupa el correo a cada cliente. La asignación se elige en la ficha del cliente; el envío del periodo se arma en Correo del periodo.",
    assignmentTip: "Se elige en la ficha de cada cliente",
    clientsCta: "Ir a clientes",
    periodMailCta: "Ir a Correo del periodo",
    periodMailHref: "/finance/dispatch/period",
  },
  list: {
    title: "Frecuencias",
    add: "Nueva frecuencia",
    emptyTitle: "Aún no hay frecuencias de envío",
    emptyDescription:
      "Aquí se define el ritmo del correo: al vuelo, semanal, cortes del mes o mensual. Crea la primera para poder asignarla a tus clientes.",
    emptyCta: "Crear primera frecuencia",
    loading: "Cargando frecuencias…",
    defaultBadge: "Predeterminado",
    inactiveBadge: "Inactivo",
    selectPrompt: "Selecciona una frecuencia de la lista para ver su detalle.",
    editRowAria: (name: string) => `Editar frecuencia ${name}`,
  },
  /** Etiquetas cortas (lista, resumen, badges). */
  cadence: {
    event: "Al vuelo",
    periodic_weekly: "Semanal",
    periodic_decadal: "Cortes del mes",
    periodic_monthly: "Mensual",
  } satisfies Record<BillingCadenceKind, string>,
  /**
   * Opciones del select: título patio + glosa humana.
   * Nunca mostrar solo el kind crudo (`event`, `periodic_decadal`, …).
   */
  cadenceOption: {
    event: "Al vuelo — en cuanto cierra el viaje",
    periodic_weekly: "Semanal",
    periodic_decadal: "Cortes del mes — p. ej. día 10, 20, fin",
    periodic_monthly: "Mensual",
  } satisfies Record<BillingCadenceKind, string>,
  weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const,
  weekdaysLong: [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ] as const,
  naturalDescription: {
    event: (hours: number) =>
      `Al vuelo: cuando un viaje se cierra, sus facturas listas pueden incluirse en un envío hasta ${hours} horas después del cierre.`,
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
    periodExampleTitle: "¿Qué facturas entran?",
    detailsTitle: "Detalles",
    createdAt: (label: string) => `Creado: ${label}`,
    updatedAt: (label: string) => `Última actualización: ${label}`,
    edit: "Editar",
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
    periodExample: {
      event: (hours: number) =>
        `Al vuelo: cada vez que se cierra un viaje, las facturas listas de ese viaje pueden incluirse en un envío hasta ${hours} horas después del cierre. No hay periodo fijo: el envío se activa por el cierre de cada viaje.`,
      weekly: (daysLong: string) =>
        `Ejemplo: cada ${daysLong} se prepara un envío con las facturas de viajes cerrados desde el último corte hasta ese día.`,
      decadal: (parts: string) => `Ejemplo: ${parts}`,
      monthlyDays: (days: string) =>
        `Ejemplo: el envío del día ${days} incluye facturas de viajes cerrados del 1 al ${days} del mes.`,
      monthlyDaysMulti: (days: string) =>
        `Ejemplo: los días ${days} de cada mes se prepara un envío con las facturas de viajes cerrados desde el último corte hasta ese día.`,
      monthlyBusiness: (n: number) =>
        `Ejemplo: el envío se prepara el ${n}.º día hábil del mes e incluye facturas de viajes cerrados desde el último corte hasta ese día.`,
      fallback:
        "Las facturas de viajes cerrados en el periodo de corte pueden incluirse en el siguiente envío.",
    },
  },
  form: {
    createTitle: "Nueva frecuencia",
    editTitle: "Editar frecuencia",
    createDescription:
      "Nombra la frecuencia y elige el ritmo: al vuelo, semanal, cortes del mes o mensual.",
    editDescription: "Ajusta el nombre, el ritmo o los días de corte.",
    name: "Nombre",
    nameHint: "Ej. Corte semanal jueves–viernes",
    cadence: "¿Con qué ritmo se prepara el envío?",
    cadenceHint:
      "Cada opción define un ciclo distinto. Las facturas de viajes cerrados entre un corte y el siguiente entran en el envío.",
    isDefault: "Frecuencia predeterminada",
    isDefaultHint:
      "Se ofrece por defecto al asignar clientes (o si el cliente no tiene frecuencia). Solo una activa puede serlo.",
    previewLabel: "Así se vería el envío",
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
      summaryTitle: "Revisa estos campos",
      nameRequired: "Indica un nombre para la frecuencia",
      windowHoursRequired: "Indica las horas tras cerrar el viaje",
      weekdaysRequired: "Selecciona al menos un día de corte",
      monthDaysRequired: "Indica al menos un día de corte del mes",
      businessDaysRequired: "Indica el día hábil (1–15)",
    },
  },
  delete: {
    title: "Desactivar frecuencia",
    description:
      "La frecuencia dejará de estar disponible para nuevos envíos del periodo. Los clientes asignados conservan la referencia hasta que la cambies.",
    confirm: "Desactivar",
    cancel: "Cancelar",
  },
  toast: {
    created: "Frecuencia creada",
    updated: "Frecuencia actualizada",
    deleted: "Frecuencia desactivada",
    error: "No se pudo guardar la frecuencia",
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
