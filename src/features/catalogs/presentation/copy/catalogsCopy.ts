function formatCount(count: number): string {
  return count.toLocaleString("es-MX");
}

export const catalogsCopy = {
  page: {
    sectionTitle: "Catálogos",
    title: "Valores de referencia",
    description:
      "Consulta los valores que el sistema ofrece al capturar viajes, facturas y domicilios.",
    searchPlaceholder:
      "Busca un catálogo o un valor: tonelada, tractocamión, efectivo…",
    emptySearchTitle: "Sin coincidencias",
    emptySearchDescription: (term: string) =>
      `Ningún catálogo coincide con «${term}». Prueba con el nombre del valor que buscas.`,
    emptyAllTitle: "Sin valores de referencia",
    emptyAllDescription: "Todavía no hay catálogos disponibles para consultar.",
  },
  readOnlyNotice: {
    listTitle: "Estos valores son de solo consulta",
    listDescription:
      "Los publica y mantiene el equipo de Boeltech, y se actualizan cuando cambian las disposiciones oficiales. Puedes consultarlos, pero no modificarlos desde aquí.",
    detailTitle: "Este catálogo es de solo consulta",
    detailOfficialDescription: (source: string) =>
      `Lo publica ${source} y el equipo de Boeltech lo mantiene actualizado. Puedes consultarlo, pero no modificarlo desde aquí.`,
    detailInternalDescription:
      "Estos valores los define Boeltech para que el sistema se comporte igual en todas las empresas. Puedes consultarlos, pero no modificarlos desde aquí.",
  },
  publisher: {
    sat: "Publicado por el SAT",
    banxico: "Publicado por Banxico",
    system: "Del sistema",
  },
  /** Quién publica el catálogo, para usarse dentro de una frase. */
  source: {
    sat: "el SAT",
    banxico: "Banxico",
    system: "Boeltech",
  },
  /** Cantidad de valores de un catálogo (tarjeta del listado y ficha del detalle). */
  valuesCount: (count: number) =>
    count === 1 ? "1 valor" : `${formatCount(count)} valores`,
  card: {
    examplesPrefix: "Por ejemplo:",
  },
  detail: {
    back: "Volver a catálogos",
    defaultDescription: "Valores disponibles en este catálogo.",
    loadingSectionTitle: "Cargando…",
    notFoundSectionTitle: "No encontrado",
    notFoundTitle: "Catálogo no encontrado",
    notFoundDescription:
      "Este catálogo no existe o ya no está disponible para tu empresa.",
    summaryVersion: (version: string) => `versión ${version}`,
    recordsSection: "Valores",
    searchPlaceholder: "Buscar por nombre o código",
    resultsLabel: "valores",
    addRecord: "Agregar registro",
  },
  table: {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    parent: "Pertenece a",
    status: "Estado",
    actions: "Acciones",
    active: "Activo",
    inactive: "Inactivo",
    copyCode: (code: string) => `Copiar código ${code}`,
    copySuccess: "Código copiado",
    copyError: "No se pudo copiar el código",
    emptySearch: "Ningún valor coincide con tu búsqueda",
    emptyAll: "Este catálogo todavía no tiene valores",
  },
  itemForm: {
    createTitle: "Nuevo registro",
    editTitle: "Editar registro",
    fields: {
      code: "Código",
      codeHint: "Letras, números, guiones y guiones bajos",
      name: "Nombre",
      description: "Descripción",
      parentCode: "Pertenece a",
      sortOrder: "Orden",
      isActive: "Activo",
    },
    save: "Guardar",
    saving: "Guardando…",
    cancel: "Cancelar",
    validationSummary: "Revisa los campos marcados antes de continuar",
  },
  itemActions: {
    edit: "Editar",
    delete: "Eliminar",
  },
  deleteConfirm: {
    title: "Eliminar registro",
    description: (code: string) =>
      `¿Eliminar el registro "${code}"? Esta acción no se puede deshacer.`,
    confirm: "Eliminar",
    cancel: "Cancelar",
  },
  mutations: {
    createSuccess: "Registro creado",
    updateSuccess: "Registro actualizado",
    deleteSuccess: "Registro eliminado",
    error: "No se pudo completar la operación",
  },
} as const;
