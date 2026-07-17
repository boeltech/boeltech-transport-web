export const catalogsCopy = {
  page: {
    sectionTitle: "Catálogos",
    searchPlaceholder: "Buscar catálogo…",
    emptySearch: "No se encontraron catálogos con ese criterio",
    emptyAll: "No hay catálogos disponibles",
  },
  tabs: {
    internal: "Internos",
    global: "Regulatorios",
    all: "Todos",
  },
  metrics: {
    totalCatalogs: "Total catálogos",
    totalRecords: "Total registros",
    regulatory: "Regulatorios",
    internal: "Catálogos internos",
  },
  globalBanner: {
    title: "Catálogos regulatorios gestionados por Boeltech",
    description:
      "Los catálogos SAT y de referencia oficial los actualiza el equipo Boeltech. Aquí solo puedes consultarlos para validar versiones y registros vigentes en tu operación.",
  },
  internalBanner: {
    title: "Catálogos internos gestionados por Boeltech",
    description:
      "Los valores base del ERP (tipos de vehículo, estados de viaje, etc.) los define el equipo Boeltech. Aquí solo puedes consultarlos.",
  },
  badges: {
    regulatory: "Regulatorio",
    internal: "Interno",
    readOnly: "Solo lectura",
  },
  card: {
    view: "Ver",
    records: (count: string) => `${count} registros`,
  },
  detail: {
    back: "Volver a Catálogos",
    notFoundTitle: "Catálogo no encontrado",
    notFoundDescription: (code: string) =>
      `El catálogo "${code}" no existe o no está disponible.`,
    recordsSection: "Registros",
    recordsDescription: (count: string) =>
      `${count} registros en este catálogo`,
    largeCatalogHint: (threshold: string) =>
      `Este catálogo tiene más de ${threshold} registros. La búsqueda se realiza en el servidor. Escribe para filtrar los resultados.`,
    addRecord: "Agregar registro",
    import: "Importar",
  },
  readOnly: {
    bannerTitle: "Catálogo de solo lectura",
    bannerDescription: (source: string, version: string) =>
      `Fuente ${source}. Versión vigente: ${version}. Para actualizar el contenido regulatorio contacta a soporte Boeltech.`,
    internalBannerDescription: (version: string) =>
      `Catálogo interno del ERP. Versión vigente: ${version}. Para solicitar cambios contacta a soporte Boeltech.`,
    versionFallback: "sin versión publicada",
  },
  itemForm: {
    createTitle: "Nuevo registro",
    editTitle: "Editar registro",
    fields: {
      code: "Código",
      codeHint: "Letras, números, guiones y guiones bajos",
      name: "Nombre",
      description: "Descripción",
      parentCode: "Código padre",
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
