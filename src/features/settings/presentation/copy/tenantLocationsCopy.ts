/**
 * Copy — directorio de ubicaciones del tenant (ADR-0053 Fase 5).
 */

export const tenantLocationsCopy = {
  page: {
    title: "Directorio de ubicaciones",
    description:
      "Bodegas y ubicaciones reutilizables del tenant para precargar paradas en viajes y sustitución fiscal.",
  },
  list: {
    title: "Ubicaciones",
    emptyTitle: "Sin ubicaciones en el directorio",
    emptyDescription:
      "Agrega bodegas o puntos operativos para reutilizarlos al crear paradas.",
    add: "Agregar ubicación",
  },
  types: {
    warehouse: "Bodega / almacén",
    other: "Otra ubicación",
  },
  form: {
    locationName: "Nombre del lugar",
    locationNameHint: "Ej. Bodega Apodaca, Patio terceros Norte",
    addressType: "Tipo",
    save: "Guardar",
    cancel: "Cancelar",
    createTitle: "Nueva ubicación",
    editTitle: "Editar ubicación",
  },
  delete: {
    title: "Eliminar ubicación",
    description:
      "La ubicación dejará de aparecer en el directorio. Las paradas que ya la usaron no se modifican.",
    confirm: "Eliminar",
    cancel: "Cancelar",
  },
  toast: {
    created: "Ubicación creada",
    updated: "Ubicación actualizada",
    deleted: "Ubicación eliminada",
    error: "No se pudo guardar la ubicación",
  },
} as const;
