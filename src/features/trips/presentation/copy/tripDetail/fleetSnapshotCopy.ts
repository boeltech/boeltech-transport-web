import type {
  TripFleetSnapshotSource,
  TripFleetWarningCode,
} from "@features/trips/domain";

/**
 * Namespace: trips.copy.tripDetail.fleetSnapshot.*
 * Tarjeta «Datos para Carta Porte» (Operación) y panel «Refrescar datos para Carta Porte».
 */
export const fleetSnapshotCopy = {
  card: {
    title: "Datos para Carta Porte",
    description:
      "Unidad y operador con los que se timbra la Carta Porte de este viaje. No cambian al editar el catálogo.",
    block: {
      vehicle: "Unidad",
      driver: "Operador",
    },
    source: {
      freeze_stamp: "Al timbrar la primera factura",
      freeze_start: "Al iniciar el viaje",
      reassignment: "Al reasignar flota",
      substitution_correction: "Al sustituir la factura",
      master_refresh: "Refrescado desde el catálogo",
      backfill_xml: "Tomado de la factura timbrada",
      backfill_master: "Tomado del catálogo al activar esta función",
    } satisfies Record<TripFleetSnapshotSource, string>,
    sourceLine: (source: string, date: string) => `${source} · ${date}`,
    lastRefresh: (name: string, reason: string) => `Por ${name} · Motivo: ${reason}`,
    lastRefreshUnknownUser: "un usuario",
    viewFullReason: "Ver motivo completo",
    viewLessReason: "Ver menos",
    reviewBadge: "Por revisar",
    reviewHint:
      "Este viaje ya había salido cuando se activó esta función, así que los datos se tomaron del catálogo de ese momento. Confirma que coincidan con la unidad y el operador que hicieron el viaje.",
    label: {
      unitNumber: "Número económico",
      plate: "Placa",
      year: "Año modelo",
      config: "Configuración vehicular",
      grossWeight: "Peso bruto vehicular",
      permitType: "Permiso SCT",
      permitNumber: "Número de permiso SCT",
      permitExpiry: "Vigencia del permiso SCT al congelar",
      rcInsurer: "Aseguradora de responsabilidad civil",
      rcPolicy: "Póliza de responsabilidad civil",
      rcExpiry: "Vigencia de la póliza RC al congelar",
      envInsurance: "Seguro de medio ambiente",
      envPolicy: "Póliza de medio ambiente",
      cargoInsurance: "Seguro de la carga",
      cargoPolicy: "Póliza de la carga",
      driverName: "Nombre",
      driverRfc: "RFC",
      driverLicense: "Licencia",
    },
    format: {
      grossWeight: (n: string) => `${n} t`,
      insurance: (insurer: string, policy: string) => `${insurer} · Póliza ${policy}`,
      catalogCode: (code: string, label: string) => `${code} · ${label}`,
    },
    value: {
      empty: "—",
      unavailable: "No disponible",
    },
    expand: "Ver todos los datos",
    collapse: "Ver menos",
    trailersNote: (plates: string) =>
      `Remolques: ${plates}. Se congelan al asignarlos y no cambian con este refresco.`,
    deactivatedBadge: "Dada de baja",
    driverDeactivatedBadge: "Dado de baja",
    diffBadge: "Distinto en catálogo",
    diffNote:
      "El catálogo actual tiene datos distintos. Es normal si la unidad o el operador se actualizaron después del viaje (por ejemplo, una póliza renovada). Refresca solo si lo congelado fue un error de captura.",
    diffNoPermission:
      "Si lo congelado es un error de captura, pide a un gerente o administrador que lo refresque.",
    action: {
      refresh: "Refrescar desde el catálogo",
    },
    empty: {
      title: "Aún no hay datos congelados",
      body: "Al iniciar el viaje faltaban datos de Carta Porte en el catálogo de la unidad o del operador. Se congelarán al timbrar la primera factura; completa el catálogo antes de facturar.",
      openVehicle: "Abrir unidad",
      openDriver: "Abrir operador",
    },
    outdated: {
      title: (folio: string) => `La factura ${folio} tiene los datos anteriores`,
      body: "Los datos para Carta Porte se refrescaron después de timbrarla. Sustitúyela para que el SAT reciba los datos correctos.",
      cta: "Sustituir factura",
      askManager: "Pide a un gerente o administrador que la sustituya.",
      openInvoice: "Abrir factura",
    },
    blocked: {
      cancelled: "El viaje está cancelado; no se pueden refrescar sus datos.",
      stamping: "Hay una factura en proceso de timbrado. Intenta cuando termine.",
      invalid: "No se puede usar: el catálogo no pasa la validación de Carta Porte.",
      vehicleMismatch:
        "La unidad de los datos congelados no es la asignada al viaje. Corrígela con la sustitución de la factura o reasignando flota.",
      driverMismatch:
        "El operador de los datos congelados no es el asignado al viaje. Corrígelo con la sustitución de la factura o reasignando flota.",
    },
    loadError: "No pudimos cargar los datos para Carta Porte.",
    retry: "Reintentar",
  },
  sheet: {
    title: "Refrescar datos para Carta Porte",
    description: (tripCode: string) =>
      `Viaje ${tripCode} · Reemplaza los datos congelados con los del catálogo actual.`,
    guidance:
      "Usa esta acción solo para corregir un error de captura de la misma unidad u operador. Si el viaje lo hizo otra unidad u otro operador, usa Reasignar flota o el cambio de unidad al sustituir la factura.",
    blocksLabel: "¿Qué quieres refrescar?",
    blockVehicle: (unitNumber: string, plate: string) => `Unidad (${unitNumber} · ${plate})`,
    blockDriver: (name: string) => `Operador (${name})`,
    blockNoChanges: "Sin cambios: el catálogo coincide con lo congelado.",
    blockInvalid: "No se puede usar: el catálogo no pasa la validación de Carta Porte.",
    table: {
      field: "Dato",
      frozen: "Congelado (en uso)",
      master: "Catálogo hoy",
    },
    showUnchanged: "Mostrar también los datos sin cambios",
    loadingPreview: "Cargando comparación con el catálogo…",
    previewError: "No pudimos cargar la comparación con el catálogo.",
    retry: "Reintentar",
    nothingToRefresh:
      "El catálogo coincide con los datos congelados. No hay nada que refrescar.",
    invalidVehicle: {
      title: "El catálogo de la unidad no pasa la validación de Carta Porte",
    },
    invalidDriver: {
      title: "El catálogo del operador no pasa la validación de Carta Porte",
    },
    invalid: {
      fixVehicle: "Corregir en el catálogo de la unidad",
      fixDriver: "Corregir en el catálogo del operador",
      after: "Después de corregirlo, vuelve aquí y actualiza la vista previa.",
    },
    refreshPreview: "Actualizar vista previa",
    deactivated: (unitNumber: string, date: string) =>
      `La unidad ${unitNumber} está dada de baja desde el ${date}. Puedes refrescar con su catálogo tal como quedó; para corregirlo primero restáurala.`,
    deactivatedNoDate: (unitNumber: string) =>
      `La unidad ${unitNumber} está dada de baja. Puedes refrescar con su catálogo tal como quedó; para corregirlo primero restáurala.`,
    driverDeactivated: (name: string) =>
      `El operador ${name} está dado de baja. Puedes refrescar con su catálogo tal como quedó; para corregirlo primero reactívalo.`,
    warnings: {
      title: "Confirma antes de refrescar",
      insurance_or_permit_changed:
        "Cambió la póliza, el permiso SCT o sus vigencias. Si fue una renovación posterior al viaje, no refresques: la Carta Porte debe declarar la póliza que cubrió el traslado.",
      identity_field_changed:
        "Cambió la placa o el RFC. Confirma que es la misma unidad u operador con un dato mal capturado; si el viaje lo hizo otra unidad u otro operador, usa Reasignar flota o la sustitución de la factura.",
      vehicle_deactivated_error_captura:
        "La unidad se dio de baja por error de captura. Si el viaje lo hizo otra unidad, cámbiala con Reasignar flota o al sustituir la factura en lugar de refrescar.",
    } satisfies Record<TripFleetWarningCode | "title", string>,
    fiscal: {
      title: "Esto no corrige la factura ya timbrada",
      bodyWithInvoice: (folio: string) =>
        `La factura ${folio} conserva los datos anteriores. Después de refrescar, sustitúyela para que la Carta Porte refleje la corrección. Las facturas nuevas o sustitutas usarán los datos refrescados.`,
      bodyNoInvoice:
        "Aún no hay factura con Carta Porte. La primera que timbres usará los datos refrescados.",
    },
    reason: {
      label: "Motivo del refresco",
      placeholder:
        "Ej.: La placa se capturó como ABC1234; la correcta es ABC1243 según la tarjeta de circulación.",
      help: "Queda en la bitácora del viaje junto con los datos antes y después.",
      counter: (n: number) => `${n}/500`,
      required: "Escribe el motivo del refresco.",
      tooShort: "El motivo debe tener al menos 10 caracteres.",
      tooLong: "El motivo no puede pasar de 500 caracteres.",
    },
    validationSummary: "Revisa el refresco",
    noBlockSelected: "Elige unidad, operador o ambos.",
    cancel: "Cancelar",
    submit: "Refrescar datos",
    submitting: "Refrescando…",
    error: {
      title: "No se pudieron refrescar los datos",
      forbidden:
        "Tu rol no puede refrescar datos para Carta Porte. Pide a un gerente o administrador.",
      stale: {
        title: "Los datos cambiaron mientras revisabas",
        body: "Alguien reasignó la flota, sustituyó la factura o refrescó estos datos. Revisa la comparación actualizada antes de continuar.",
      },
      seeInline: "Revisa el detalle en el panel.",
    },
  },
  toast: {
    successTitle: "Datos para Carta Porte refrescados",
    successWithInvoice: (folio: string) =>
      `Ahora sustituye la factura ${folio} para corregirla ante el SAT.`,
    successNoInvoice: "La próxima factura con Carta Porte usará estos datos.",
  },
} as const;
