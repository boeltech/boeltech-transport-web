/**
 * Copy — detalle de cliente (/clients/:id)
 *
 * Léxico operativo: identificación de negocio, crédito, contactos, direcciones y viajes.
 */

/** Cohorte operativa: excluye borradores y cancelados (alineado en stats e histórico). */
const operationalCohortHint =
  "Excluye viajes con estado borrador y cancelado" as const;

const operatingRevenue = {
  label: "Ingresos",
  singular: "Ingreso",
  summaryTooltip: `Factura timbrada o tarifa base por viaje · ${operationalCohortHint} · Sin costos ni margen`,
  historyDescription:
    "Ingreso por viaje (factura timbrada o tarifa base). Sin costos ni margen.",
  perTripHint:
    "Factura timbrada cuando existe; si no, tarifa base del viaje.",
} as const;

export const clientDetailCopy = {
  operatingRevenue,
  title: {
    fallback: "Cliente",
  },
  state: {
    notFoundTitle: "Cliente no encontrado",
    notFoundDescription: "El cliente que buscas no existe o fue eliminado.",
    backToList: "Volver a clientes",
  },
  tabs: {
    client: "Cliente",
    contacts: "Contactos",
    addresses: "Direcciones",
    trips: "Viajes",
  },
  alerts: {
    missingBillingCp: {
      title: "Falta código postal para facturar",
      text: "Agrega un domicilio fiscal con código postal. Se usa como receptor del CFDI, no como parada de viaje.",
      goToAddresses: "Ir a Direcciones",
    },
    noTripPlaces: {
      title: "No hay lugares para viajes",
      text: "Captura bodegas, puntos de entrega o recolección para reutilizarlos al armar la ruta.",
      goToAddresses: "Ir a Direcciones",
    },
    rfcSuspicious: {
      title: "RFC incompleto o inválido",
      text: "Verifica longitud y caracteres del RFC según el tipo de persona (moral 12 · física 13).",
    },
    creditNoLimit: {
      title: "Crédito sin límite definido",
      text: "El cliente está en crédito sin límite registrado. Define un monto para control de exposición.",
    },
  },
  identification: {
    title: "Identificación",
    description: "Razón social, RFC y régimen del cliente.",
    legalName: "Razón social",
    tradeName: "Nombre comercial",
    taxId: "RFC",
    taxRegime: "Régimen",
    billingEmail: "Correo de facturación",
  },
  notes: {
    title: "Notas",
    description: "Observaciones internas sobre el cliente.",
    empty: "Sin notas",
  },
  commercial: {
    title: "Términos comerciales",
    description: "Forma de pago y condiciones de crédito.",
    paymentTerms: "Forma de pago",
    creditDays: "Días de crédito",
    creditDaysValue: (days: number) => `${days} días`,
  },
  contacts: {
    title: "Contactos",
    emptyTitle: "No hay contactos registrados",
    emptyDescription:
      "Agrega personas de contacto con roles para viajes, facturas o pagos.",
    addFirst: "Agregar primer contacto",
    addNew: "Nuevo contacto",
    createTitle: "Nuevo contacto",
    editTitle: "Editar contacto",
    formHint: "Los cambios se guardan al confirmar.",
    createSubmit: "Crear contacto",
    updateSubmit: "Guardar cambios",
    deleteTitle: "¿Eliminar contacto?",
    deleteDescription: (name: string) =>
      `El contacto ${name} se desactivará y dejará de aparecer en la lista.`,
  },
  primaryContact: {
    title: "Contacto principal",
    description: "Acceso rápido al contacto marcado como principal.",
    empty: "No hay contacto principal registrado.",
    cta: "Ir a Contactos",
    viewInContacts: "Ver en Contactos",
  },
  address: {
    groups: {
      fiscal: "Fiscal",
      forTrips: "Para viajes",
      other: "Otros",
    },
    masterTitle: "Direcciones",
    newAddress: "Nueva dirección",
    createTitle: "Nueva dirección",
    createDescription: "Captura los datos. Se guardará al confirmar.",
    editTitle: "Editar dirección",
    editDescription: "Los cambios se guardan al confirmar.",
    emptyTitle: "No hay direcciones registradas",
    emptyDescriptionReadOnly:
      "Puedes agregar direcciones desde la pantalla Editar cliente.",
    emptyDescription:
      "Agrega el domicilio fiscal para facturar y, si aplica, bodegas o puntos de viaje.",
    emptyCta: "Agregar primera dirección",
    emptyHints: {
      fiscal: "Registra al menos un domicilio fiscal con código postal para CFDI.",
      trips: "Bodegas, entrega y recolección se reutilizan al armar viajes.",
      other: "Oficina u otros quedan en este tab; no salen en el picker de paradas.",
    },
    creatingHintTitle: "Nueva dirección",
    creatingHintBody: "Completa el formulario a la derecha para guardarla.",
    locationTitle: "Ubicación",
    street: "Calle",
    neighborhoodPostal: "Colonia / CP",
    state: "Estado",
    municipality: "Municipio",
    reference: "Referencia",
    coordinates: "Coordenadas",
    tripPartyTitle: "Para el viaje",
    tripPartyRfc: "RFC en esta ubicación",
    tripPartyName: "Nombre",
    contactTitle: "Contacto en esta ubicación",
    contactName: "Nombre",
    contactPhone: "Teléfono",
    contactEmail: "Correo",
    businessHours: "Horario",
    specialInstructions: "Instrucciones especiales",
    notes: "Notas",
    readyForTrip: "Listo para viaje",
    missingTripData: "Faltan datos de ubicación",
    fiscalReady: "Con código postal",
    fiscalMissingCp: "Falta código postal",
    geoPending: "Ubicación en mapa pendiente",
    setPrimary: "Marcar principal",
    edit: "Editar",
    delete: "Eliminar",
    primary: "Principal",
    inactive: "Inactiva",
    catalogLoading: "Cargando…",
    createSubmit: "Crear dirección",
    updateSubmit: "Guardar cambios",
    cancel: "Cancelar",
    selectPrompt: "Selecciona una dirección de la lista o crea una nueva.",
    mobileFormOpen: "Formulario abierto en panel inferior.",
    sheetDescription: "Los cambios se guardan al confirmar esta acción.",
    saving: "Guardando…",
  },
  history: {
    tab: "Viajes",
    title: "Viajes del cliente",
    description: operatingRevenue.historyDescription,
    includeExcludedLabel: "Incluir borradores y cancelados",
    table: {
      trip: "Viaje",
      route: "Ruta",
      date: "Salida programada",
      revenue: operatingRevenue.singular,
      source: "Fuente",
      status: "Estatus viaje",
      invoice: "Factura",
      empty: "Este cliente aún no tiene viajes registrados.",
    },
    revenueSource: {
      invoice_subtotal: "Factura timbrada",
      trip_base_rate: "Tarifa base",
    } as Record<string, string>,
    invoiceStatus: {
      none: "Sin factura",
    } as Record<string, string>,
  },
  stats: {
    activeTrips: "Viajes activos",
    lastTrip: "Último viaje",
    lastTripEmpty: "Sin viajes operativos",
    totalTripsHint: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"} operativo${count === 1 ? "" : "s"}`,
    operationalHint: operationalCohortHint,
    revenue: operatingRevenue.label,
    revenueTooltip: operatingRevenue.summaryTooltip,
    avgPaymentDays: "Días prom. pago",
    avgPaymentHint: "Promedio real desde pagos registrados",
    noPayments: "Sin pagos",
  },
  actions: {
    deleteTitle: "¿Eliminar cliente?",
    deleteDescription: (name: string) =>
      `Se dará de baja a ${name}. Dejará de mostrarse en el listado y no podrás seguir operando su ficha como hasta ahora.`,
  },
} as const;
