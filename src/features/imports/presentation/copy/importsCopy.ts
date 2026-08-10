/**
 * Copy — carga masiva de datos maestros (ADR-0074).
 * Léxico operativo: evitar jerga TI/pipeline/fiscal en superficie.
 * Leyenda de plantilla: `./importTemplateGuide.ts` (namespace guide).
 */

import {
  IMPORT_ENTITY_TYPE_LABELS,
  type ImportEntityType,
  type ImportImplementedEntityType,
  type ImportJob,
  type ImportRowAction,
} from "../../domain";

export {
  IMPORT_TEMPLATE_GUIDES,
  importTemplateGuideCopy,
} from "./importTemplateGuide";
export type {
  ImportTemplateGuide,
  TemplateColumnGuide,
  TemplateColumnRequirement,
} from "./importTemplateGuide";

/** Etiquetas operativas para la acción prevista por fila (API: insert|update|skip). */
export const IMPORT_ROW_ACTION_LABELS: Record<ImportRowAction, string> = {
  insert: "Alta",
  update: "Actualización",
  skip: "Se omite",
};

export const importsCopy = {
  hub: {
    sectionTitle: "Cargas",
    title: "Carga desde archivo",
    description:
      "Sube clientes, direcciones, empleados, vehículos o conductores en bloque. Usa la plantilla, revisa el archivo y aplica la carga.",
    /** CTA principal del hub (familia D6). */
    newImport: "Nueva carga",
    emptyTitle: "Aún no hay cargas",
    emptyDescription:
      "Cuando subas un archivo, verás aquí el historial y podrás descargar los problemas si los hubo.",
    emptyAction: "Importar desde archivo",
    entityLabelPlural: "cargas",
    filters: {
      entityType: "Qué cargaste",
      entityTypeAll: "Todos",
      status: "Estado",
      statusAll: "Todos los estados",
    },
  },
  wizard: {
    title: (entityType: ImportEntityType) =>
      `Importar ${IMPORT_ENTITY_TYPE_LABELS[entityType].toLowerCase()}`,
    titleGeneric: "Importar desde archivo",
    description:
      "Sube el archivo con la plantilla, revisa el resultado y confirma la carga.",
    /**
     * Tip corto de orden. Si el tipo está fijado, copy contextual;
     * en hub (tipo libre) muestra la guía completa breve.
     */
    loadOrderHint: (
      entityType: ImportImplementedEntityType,
      locked: boolean,
    ): string | null => {
      if (!locked) {
        return "Orden sugerido: primero clientes, luego direcciones. Después empleados y, al final, conductores. Los vehículos se pueden cargar en cualquier momento.";
      }
      switch (entityType) {
        case "addresses":
          return "Las direcciones necesitan que el cliente o el empleado dueño ya exista.";
        case "drivers":
          return "Los conductores necesitan que el empleado ya exista.";
        case "employees":
          return "Si luego vas a cargar conductores, sube primero los empleados.";
        case "clients":
          return "Si también vas a cargar direcciones, hazlo después de los clientes.";
        case "vehicles":
          return null;
        default:
          return null;
      }
    },
    pendingHint:
      "La revisión o la aplicación puede tardar con archivos grandes. No cierres esta ventana.",
    steps: {
      upload: "Archivo",
      validate: "Revisión",
      options: "Confirmar",
      result: "Resultado",
    },
    upload: {
      entityLabel: "Qué vas a cargar",
      chooseFile: "Seleccionar archivo",
      dragHint: "Arrastra el archivo aquí o selecciónalo desde tu equipo",
      downloadTemplate: "Descargar plantilla",
      selected: (name: string) => `Archivo: ${name}`,
      next: "Revisar archivo",
      csvOnly: "Solo se permiten archivos CSV",
    },
    validate: {
      summary: (valid: number, errors: number, total: number) =>
        `${valid} listas · ${errors} con problema · ${total} en total`,
      failedTitle: "No hay filas listas para cargar",
      failedDescription:
        "Corrige el archivo o descarga la plantilla y vuelve a revisarlo.",
      previewTitle: "Detalle de filas (muestra)",
      errorsTitle: "Problemas encontrados",
      moreErrors: (n: number) =>
        `Y ${n} más. Descarga el archivo de problemas para verlos todos.`,
      downloadErrors: "Descargar problemas",
      back: "Anterior",
      next: "Continuar",
      colRow: "Fila",
      colKey: "Identificador",
      colAction: "Qué hará",
      colStatus: "Estado",
      valid: "Lista",
      invalid: "Problema",
      rowLabel: (row: number, detail: string) => `Fila ${row}: ${detail}`,
      rowAction: (action: ImportRowAction | null) =>
        action ? IMPORT_ROW_ACTION_LABELS[action] : "—",
    },
    options: {
      updateExisting: "Actualizar si ya existe",
      updateExistingHint:
        "Si el registro ya está en el sistema, se actualiza en lugar de dejarlo igual.",
      skipErrors: "Continuar aunque haya filas con problema",
      skipErrorsHint:
        "Aplica las filas correctas y deja fuera las que fallen. Si lo desactivas, se detiene en el primer problema.",
      confirm: "Aplicar carga",
      back: "Anterior",
      cancel: "Cancelar",
    },
    result: {
      successTitle: "Carga aplicada",
      partialTitle: "Carga aplicada con problemas",
      counts: (
        inserted: number,
        updated: number,
        skipped: number,
        errors: number,
      ) =>
        `${inserted} nuevas · ${updated} actualizadas · ${skipped} omitidas · ${errors} con problema`,
      downloadErrors: "Descargar problemas",
      close: "Cerrar",
    },
    cancel: "Cancelar",
  },
  entityPicker: {
    clients: IMPORT_ENTITY_TYPE_LABELS.clients,
    addresses: IMPORT_ENTITY_TYPE_LABELS.addresses,
    employees: IMPORT_ENTITY_TYPE_LABELS.employees,
    vehicles: IMPORT_ENTITY_TYPE_LABELS.vehicles,
    drivers: IMPORT_ENTITY_TYPE_LABELS.drivers,
  } satisfies Record<ImportImplementedEntityType, string>,
  table: {
    entityType: "Qué se cargó",
    status: "Estado",
    filename: "Archivo",
    result: "Resultado",
    when: "Cuándo",
    actions: "Acciones",
    downloadErrors: "Descargar problemas",
    downloadErrorsAria: (filename: string | null) =>
      filename
        ? `Descargar problemas de ${filename}`
        : "Descargar problemas de la carga",
    /** Resumen operativo según fase del job (sin columnas redundantes). */
    resultSummary: (job: Pick<
      ImportJob,
      | "status"
      | "validCount"
      | "errorCount"
      | "insertedCount"
      | "updatedCount"
      | "rowCount"
    >) => {
      if (job.status === "committed") {
        const parts = [
          `${job.insertedCount} nuevas`,
          `${job.updatedCount} actualizadas`,
        ];
        if (job.errorCount > 0) {
          parts.push(`${job.errorCount} con problema`);
        }
        return parts.join(" · ");
      }
      if (job.rowCount === 0 && job.validCount === 0 && job.errorCount === 0) {
        return "—";
      }
      return `${job.validCount} listas · ${job.errorCount} con problema`;
    },
  },
  cta: {
    /** CTA en listados de entidad (familia D6). */
    importCsv: "Importar desde archivo",
  },
  errors: {
    generic: "No se pudo completar la operación",
    validateFailed: "No se pudo revisar el archivo",
    commitFailed: "No se pudo aplicar la carga",
    templateFailed: "No se pudo descargar la plantilla",
    errorsDownloadFailed: "No se pudo descargar el archivo de problemas",
  },
} as const;
