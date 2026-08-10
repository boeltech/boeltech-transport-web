/**
 * Copy del wizard de importación de catálogos (SAT-first / Platform release kit UI).
 */

export const catalogImportWizardCopy = {
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
