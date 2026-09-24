/**
 * Copy del wizard de importación de catálogos (SAT-first / Platform release kit UI).
 */

export const catalogImportWizardCopy = {
  dialogTitle: (typeName: string) => `Importar catálogo: ${typeName}`,
  steps: {
    upload: "Seleccionar archivo",
    validate: "Validar datos",
    import: "Configurar importación",
    result: "Resultado",
  },
  stepProgress: (current: number, total: number) =>
    `Paso ${current} de ${total}`,
  actions: {
    cancel: "Cancelar",
    close: "Cerrar",
    back: "Anterior",
    continue: "Continuar",
    validateFile: "Validar archivo",
    importCatalog: "Importar catálogo",
    changeFile: "Cambiar archivo",
    selectFile: "Seleccionar archivo",
    downloadTemplate: "Descargar plantilla",
  },
  upload: {
    loadingCatalog: "Cargando información del catálogo...",
    noVersion: "Sin versión",
    itemsCurrentSuffix: "items actuales",
    lastUpdated: (date: string) => `Última actualización: ${date}`,
    dropzoneTitle:
      "Arrastra un archivo CSV aquí o haz clic para seleccionar",
    dropzoneHint:
      "Formato: código, nombre, descripción (opcional), código padre (opcional)",
    fileSizeKb: (size: string) => `${size} KB`,
  },
  csvTypeMismatch: {
    title: "Tipo de catálogo incorrecto",
  },
  validate: {
    fileValid: "Archivo válido",
    fileWithErrors: "Archivo con errores",
    validRowsSummary: (valid: number, total: number) =>
      `${valid} de ${total} registros válidos`,
    estimatedDeactivateTitle: "Desactivación estimada",
    estimatedDeactivateBefore: "Se desactivarían",
    estimatedDeactivateAfter:
      "ítems activos si marcas «Desactivar registros que no estén en el archivo» en el siguiente paso.",
    errorsFound: (count: number) => `Errores encontrados (${count}):`,
    errorsTruncated: (shown: number, total: number) =>
      `Mostrando ${shown} de ${total} errores (respuesta truncada).`,
    errorsMore: (count: number) => `Y ${count} errores más...`,
    previewTitle: "Vista previa (primeros 10 registros):",
    columns: {
      row: "Fila",
      errors: "Errores",
      code: "Código",
      name: "Nombre",
      description: "Descripción",
      parent: "Padre",
    },
    emptyCell: "—",
  },
  importForm: {
    currentVersionTitle: "Versión actual",
    currentVersionBefore: "La versión actual del catálogo es",
    currentVersionWith: "con",
    currentVersionItemsSuffix: "items.",
    versionLabel: "Nueva versión",
    versionDescription: (example: string) =>
      `Formato sugerido: X.Y.YYYYMMDD (ej: ${example})`,
    versionPlaceholder: "ej: 1.0.20260325",
    sourceUrlLabel: "URL de origen (opcional)",
    sourceUrlPlaceholder: "https://www.sat.gob.mx/...",
    notesLabel: "Notas (opcional)",
    notesPlaceholder: "Notas sobre esta versión...",
    optionsTitle: "Opciones de importación",
    skipErrorsLabel: "Omitir registros con errores y continuar",
    deactivateMissingLabel:
      "Desactivar registros que no estén en el archivo",
    summaryTitle: "Resumen de importación",
    summaryImportBefore: "Se importarán",
    summaryImportMiddle: "registros al catálogo",
    summaryImportEnd: ".",
    summaryCurrentBefore: "Actualmente tiene",
    summaryCurrentAfter: "items.",
    validationSummaryTitle: "Revisa la configuración de importación",
    schema: {
      versionRequired: "La versión es requerida",
      invalidUrl: "URL inválida",
    },
  },
  result: {
    successTitle: "Importación completada",
    successWithErrorsTitle: "Importación completada con errores",
    versionDuration: (version: string, seconds: string) =>
      `Versión: ${version} • Tiempo: ${seconds} segundos`,
    stats: {
      total: "Total",
      inserted: "Insertados",
      updated: "Actualizados",
      errors: "Errores",
    },
    deactivatedTitle: "Ítems desactivados",
    deactivatedBefore: "Se desactivaron",
    deactivatedAfter: "registros que no estaban en el archivo.",
    errorsTitle: "Errores:",
    columns: {
      row: "Fila",
      errors: "Errores",
    },
  },
  upsertHint:
    "Los registros del archivo siempre se insertan o actualizan por código.",
  csvTypeMismatchHint:
    "Descarga la plantilla del tipo correcto o elige otro catálogo.",
  deactivateConfirm: {
    title: "¿Desactivar ítems faltantes?",
    description: (count: number) =>
      `Se desactivarían ${count.toLocaleString("es-MX")} ítems activos que no están en el archivo. Esta acción aplica al confirmar la importación.`,
    descriptionUnknown:
      "Se desactivarían los ítems activos que no estén en el archivo. Confirma solo si ese es el alcance del release.",
    confirm: "Sí, desactivar faltantes",
    cancel: "Cancelar",
  },
  detected: {
    profile: (profile: string) => `Perfil detectado: ${profile}`,
    delimiter: (delimiter: string) => `Delimitador: ${delimiter}`,
  },
  auditHint: {
    title: "Registrado en auditoría",
    description:
      "Puedes revisar la acción «Catálogo actualizado» en el historial de plataforma.",
    link: "Ver auditoría",
  },
  csvHelp: {
    title: "Formato preferido (SAT)",
    satPrimary:
      "Usa los encabezados del export SAT (columnas c_*). Descarga la plantilla del tipo para ver el orden exacto.",
    satCp:
      "Para códigos postales, preferir columnas SAT: c_CodigoPostal, c_Estado, c_Municipio, c_Localidad. El nombre puede omitirse.",
    compatSecondary:
      "También se aceptan columnas compatibles codigo/nombre (o code/name) como respaldo.",
  },
} as const;
