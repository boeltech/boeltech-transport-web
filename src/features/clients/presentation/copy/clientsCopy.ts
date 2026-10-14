/** Copy del listado de clientes (`ClientsListPage`). */
export const clientsCopy = {
  page: {
    title: "Clientes",
    description: "Gestiona tus clientes y sus direcciones",
    descriptionManager:
      "Si patio no halló al cliente en la lista, dalo de alta aquí.",
    refreshSuccess: "Lista actualizada",
  },

  actions: {
    create: "Nuevo Cliente",
    import: "Importar",
    importAria: "Importar clientes desde archivo",
    clearFilters: "Limpiar filtros",
  },

  filter: {
    showFilters: "Filtros",
    searchPlaceholder: "Nombre, RFC o código",
    typeLabel: "Tipo",
    typeAll: "Todos",
    paymentLabel: "Pago",
    paymentAll: "Todos",
    statusLabel: "Estado",
    statusAll: "Todos",
    typeMoral: "Persona Moral",
    typeIndividual: "Persona Física",
    paymentCash: "Contado",
    paymentCredit: "Crédito",
    statusActive: "Activos",
    statusInactive: "Inactivos",
  },

  chip: {
    typeMoral: "Tipo: Moral",
    typeIndividual: "Tipo: Física",
    paymentCash: "Pago: Contado",
    paymentCredit: "Pago: Crédito",
    statusActive: "Estado: Activos",
    statusInactive: "Estado: Inactivos",
  },

  empty: {
    title: "No se encontraron clientes",
    descriptionClear: "Comienza agregando tu primer cliente",
    descriptionClearManager:
      "Patio no halló al cliente. Dalo de alta aquí.",
    descriptionReadonly:
      "Aún no hay clientes. Pide el alta a administración.",
    descriptionFiltered:
      "Nada coincide. Prueba otro nombre o RFC, o limpia los recortes.",
  },

  card: {
    actionsAria: "Abrir menú de acciones",
  },

  table: {
    code: "Código",
    legalName: "Razón social",
    taxId: "RFC",
    type: "Tipo",
    payment: "Pago",
    contact: "Contacto",
    status: "Estado",
  },

  /** Copy del form largo de edición (D8/D9). */
  form: {
    action: {
      cancel: "Cancelar",
      save: "Guardar Cambios",
      saving: "Guardando...",
    },
    edit: {
      sidebar: {
        title: "Secciones",
        errorsTitle: (count: number, label: string) =>
          `${count} error${count === 1 ? "" : "es"} en ${label}`,
        errorsAria: (count: number) => `${count} errores`,
      },
    },
    section: {
      type: { nav: "Tipo" },
      fiscal: { nav: "Fiscal" },
      dispatch: { nav: "Envío" },
      commercial: { nav: "Comercial" },
      notes: { nav: "Notas" },
    },
  },
} as const;
