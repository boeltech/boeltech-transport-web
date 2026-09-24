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

/** CTA post-commit del wizard (máx. 3 por entidad). */
export type ImportResultNextAction = {
  label: string;
  href: string;
};

export type ImportResultScopeCopy = {
  persisted: string;
  operable: string;
  /** Gap hacia timbrado CP / factura; omitir si no aplica. */
  gap: string | null;
  actions: ReadonlyArray<ImportResultNextAction>;
};

export const importsCopy = {
  hub: {
    sectionTitle: "Importar padrón",
    title: "Carga desde archivo",
    description:
      "Deja el padrón listo para consultar y asignar. Que la carga salga bien no significa que todo esté listo para timbrar: algunos datos se completan en el expediente o al facturar el viaje.",
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
      "Sube el archivo con la plantilla, revisa las filas y confirma. La carga alimenta el padrón operable; el timbrado se valida después en el viaje o la factura.",
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
        `${valid} válidas · ${errors} con problema · ${total} en total`,
      failedTitle: "No hay filas válidas para cargar",
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
      valid: "Válida",
      invalid: "Con problema",
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
      vehiclesBillingNotice:
        "Las unidades de tracción (tracto, tórton, rabón) se cobran este mes completo, aunque las registres a mitad de mes.",
      subscriptionLink: "Ver suscripción",
      subscriptionHref: "/settings/subscription",
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
      scopeTitle: "Qué significa este resultado",
      scopePersistedLabel: "Quedó en el padrón",
      scopeOperableLabel: "Ya puedes",
      scopeGapLabel: "Para timbrar",
      nextStepsLabel: "Siguiente",
      downloadErrors: "Descargar problemas",
      close: "Cerrar",
      /**
       * Alcance post-commit por maestro (Producto D2).
       * No inventa estados de entidad: solo orienta gates persistir / asignar / timbrar.
       */
      scope: {
        clients: {
          persisted: "Los clientes quedaron guardados con RFC, razón social y régimen.",
          operable:
            "Consultarlos en el padrón y usarlos en viajes o facturación.",
          gap: "Si falta un dato menor del receptor, se completa al facturar.",
          actions: [{ label: "Ver clientes", href: "/clients" }],
        },
        addresses: {
          persisted: "Los domicilios quedaron ligados al dueño que ya existía.",
          operable: "Usarlos como parada cuando el dueño esté en el viaje.",
          gap: "Si el domicilio está incompleto para Carta Porte, se corrige en la parada o al timbrar.",
          actions: [{ label: "Ver clientes", href: "/clients" }],
        },
        employees: {
          persisted: "Los empleados quedaron en el padrón (el RFC puede ir vacío).",
          operable:
            "Consultarlos y, si aplica, registrarlos después como conductores.",
          gap: "Sin RFC no se puede timbrar Carta Porte si van como figura de transporte. Complétalo en el expediente.",
          actions: [
            { label: "Ver empleados", href: "/employees" },
            { label: "Completar RFC", href: "/employees" },
          ],
        },
        vehicles: {
          persisted:
            "Las unidades quedaron con los datos de autotransporte exigidos al alta (permiso, configuración, seguro RC).",
          operable: "Asignarlas a un viaje.",
          gap: "Si la configuración es S/R, el remolque se elige en el viaje (no en este archivo).",
          actions: [
            { label: "Ver vehículos", href: "/vehicles" },
            { label: "Remolques", href: "/trailers" },
          ],
        },
        drivers: {
          persisted:
            "Los conductores quedaron ligados al empleado con licencia federal SICT y/o estatal.",
          operable: "Asignarlos a un viaje.",
          gap: "Al timbrar Carta Porte se exige RFC del empleado y al menos una licencia vigente (NumLicencia).",
          actions: [
            { label: "Ver conductores", href: "/drivers" },
            { label: "Empleados", href: "/employees" },
          ],
        },
      } satisfies Record<ImportImplementedEntityType, ImportResultScopeCopy>,
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
      return `${job.validCount} válidas · ${job.errorCount} con problema`;
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
