/**
 * Copy — directorio de ubicaciones del tenant (ADR-0053 Fase 5).
 * Namespace: settings.copy.tenantLocations.*
 */

export const tenantLocationsCopy = {
  page: {
    breadcrumb: "Directorio",
    title: "Bodegas y puntos de la empresa",
    description:
      "Lugares de la empresa que no son de un cliente ni de una sucursal. Se reutilizan al armar paradas.",
  },
  guide: {
    title: "Cuándo usar este directorio",
    use: "Bodega o patio propio, o de un tercero, que no pertenece a un cliente ni a una sucursal.",
    notTitle: "No lo uses para",
    notClient: "Patio o bodega del cliente — va en Cliente → Direcciones.",
    notBranch: "Patio de una sucursal — va en Sucursales.",
    notFiscal: "Domicilio fiscal de la empresa — va en General.",
    notStop:
      "Un lugar de un solo viaje — captúralo en la parada; no hace falta catalogarlo.",
  },
  list: {
    title: "Ubicaciones",
    emptyTitle: "Sin ubicaciones en el directorio",
    emptyDescription:
      "Agrega una bodega o patio de la empresa para reutilizarlo en paradas. Si el lugar es del cliente o de una sucursal, no va aquí.",
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
    createTitle: "Nueva ubicación de la empresa",
    editTitle: "Editar ubicación de la empresa",
    hint: "Nombre, domicilio y datos operativos de este lugar. No es una dirección de cliente.",
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
