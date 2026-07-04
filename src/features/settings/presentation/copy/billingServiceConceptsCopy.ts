export const billingServiceConceptsCopy = {
  page: {
    title: "Servicios de cobro",
    description:
      "Catálogo reutilizable para partidas de servicio en facturas de ingreso (maniobras, resguardo, estadía, etc.).",
    backToBilling: "Volver a facturación",
  },
  info: {
    title: "Uso en facturas",
    description:
      "Al crear o editar una factura, podrás elegir estos conceptos para precargar clave SAT, unidad, IVA y precio sugerido.",
  },
  list: {
    title: "Servicios",
    add: "Nuevo servicio",
    emptyTitle: "Sin servicios configurados",
    emptyDescription:
      "Agrega conceptos que reutilizarás al armar partidas de servicio en tus CFDI.",
    loading: "Cargando servicios…",
  },
  form: {
    createTitle: "Nuevo servicio de cobro",
    editTitle: "Editar servicio",
    name: "Nombre",
    nameHint: "Ej. Maniobra, Resguardo, Estadía",
    claveProdServ: "Clave producto/servicio",
    claveProdServHint: "Catálogo SAT c_ClaveProdServ para el complemento de factura.",
    claveUnidad: "Clave unidad",
    claveUnidadHint: "Catálogo SAT c_ClaveUnidad (ej. E48 Servicio).",
    unidad: "Descripción de unidad",
    unidadHint: "Texto que verás en la partida del CFDI (ej. Servicio, Hora).",
    defaultUnitPrice: "Precio unitario sugerido",
    defaultUnitPriceHint: "Opcional. Precarga el valor al agregar la partida en una factura.",
    taxesHeading: "Impuestos por defecto",
    taxesHint: "Se aplican al crear la partida; puedes ajustarlos en cada factura.",
    ivaAplica: "Aplica IVA",
    retencionAplica: "Aplica retención",
    save: "Guardar",
    cancel: "Cancelar",
    deactivate: "Desactivar",
    validation: {
      nameRequired: "Indica un nombre para el servicio",
      claveProdServRequired: "Selecciona una clave producto/servicio",
      claveUnidadRequired: "Selecciona una clave de unidad",
      unidadRequired: "Indica la descripción de unidad",
    },
  },
  delete: {
    title: "Desactivar servicio",
    description:
      "El servicio dejará de aparecer al facturar. Las facturas ya emitidas no se modifican.",
    confirm: "Desactivar",
    cancel: "Cancelar",
  },
  toast: {
    created: "Servicio de cobro creado",
    updated: "Servicio de cobro actualizado",
    deleted: "Servicio de cobro desactivado",
    error: "No se pudo guardar el servicio de cobro",
  },
} as const;
