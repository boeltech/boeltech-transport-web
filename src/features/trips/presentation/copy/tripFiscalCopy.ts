export const tripFiscalCopy = {
  overlayErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
  correctionSheet: {
    title: "Corregir datos fiscales",
    subtitle: (stopOrder: number, stopTypeLabel: string, location: string) =>
      `Parada ${stopOrder + 1} · ${stopTypeLabel} · ${location}`,
    description:
      "Actualiza RFC o domicilio de esta parada para Carta Porte. Los cambios aplican al viaje.",
    tabRfc: "RFC",
    tabRfcHint:
      "Corrige el RFC remitente o destinatario según el tipo de parada.",
    tabAddress: "Domicilio",
    tabAddressHint:
      "Reemplaza el domicilio SAT de la parada desde catálogo o captura manual.",
    contextTitle: "Valores actuales en la parada",
    contextStopLine: (stopOrder: number, stopTypeLabel: string, location: string) =>
      `Parada ${stopOrder + 1} · ${stopTypeLabel} · ${location}`,
    contextRfc: "RFC en parada",
    contextAddress: "Domicilio registrado",
    contextEmpty: "Sin registrar",
    noPermissionRfc:
      "Tu rol no permite corregir el RFC de paradas. Solicita acceso a un administrador.",
    noPermissionAddress:
      "Tu rol no permite corregir domicilios de paradas. Solicita acceso a un administrador.",
    saving: "Guardando…",
    close: "Cerrar",
    action: "Corregir datos fiscales",
    readOnlyHint:
      "La ruta está en solo lectura. Si el viaje está completado y la factura aún no está timbrada, usa la corrección fiscal por parada.",
    substitutionHint:
      "La factura ya está timbrada. Usa sustitución para corregir datos fiscales.",
    address: {
      swapLabel: "Buscar dirección existente",
      swapDescription:
        "Reutiliza un domicilio operativo del cliente (bodega, entrega o recolección) o del directorio. Se copia a la parada; no modifica el catálogo ni el domicilio fiscal de facturación.",
      inlineLabel: "Capturar domicilio corregido",
      locationNameLabel: "Nombre del lugar",
      locationNamePlaceholder:
        "Ej: Bodega Central, CEDIS Norte, Planta Monterrey…",
      pickerLabel: "Buscar dirección existente",
      pickerPlaceholder: "Nombre, calle o código postal…",
      tripClientRequired:
        "El viaje debe tener cliente asignado para reutilizar un domicilio del catálogo.",
      reasonLabel: "Motivo del cambio",
      reasonTooShort: "El motivo debe tener al menos 5 caracteres",
      pickerRequired: "Selecciona una dirección del catálogo",
      addressUnchanged:
        "La dirección elegida coincide con la registrada en la parada",
      saveCorrection: "Guardar cambios",
      addressValidationFailed:
        "El domicilio no cumple los requisitos SAT para parada. Revisa el detalle abajo.",
      addressValidationSummaryTitle: "Revisa el domicilio corregido",
      coordinatesFarFromPostalCode: (distanceKm: number, postalCode: string) =>
        `Las coordenadas están a unos ${Math.round(distanceKm)} km del centro aproximado del CP ${postalCode}. Revisa latitud y longitud: no bloquea el timbrado, pero puede afectar distancias en Carta Porte.`,
      coordinatesFarFromPostalCodeReference: (input: {
        label: string;
        latitude: number;
        longitude: number;
        query: string;
        resolutionSource: string;
      }) =>
        `Referencia del sistema para el CP (consulta «${input.query}», fuente ${input.resolutionSource}): ${input.label} — lat ${input.latitude.toFixed(6)}, lng ${input.longitude.toFixed(6)}.`,
      preflightRfcMissing:
        "La dirección elegida no tiene RFC remitente/destinatario. Corrígelo en la pestaña RFC o elige otra fuente.",
      preflightRfcInvalid:
        "El RFC de la dirección elegida no tiene formato SAT válido.",
    },
  },
  fixSheet: {
    title: "Corregir RFC de parada",
    description: (order: number, stopTypeLabel: string, location: string) =>
      `Parada ${order + 1} · ${stopTypeLabel} · ${location}`,
    rfcLabel: "RFC remitente/destinatario",
    rfcInvalid: "Formato SAT inválido",
    nombreLabel: "Nombre (opcional)",
    reasonLabel: "Motivo del cambio",
    reasonPlaceholder: "Ej. RFC incorrecto capturado en el alta del viaje",
    reasonTooShort: "El motivo debe tener al menos 5 caracteres",
    counter: (current: number, max: number) => `${current}/${max}`,
    propagateLabel: "También actualizar el RFC en la dirección guardada del cliente",
    propagateHint: "Evita repetir este error en futuros viajes",
    cancel: "Cancelar",
    submitStamp: "Validar y retimbrar",
    submitSave: "Guardar cambios",
    noPermission: "No tienes permiso para corregir datos fiscales de paradas.",
    successTitle: "Datos fiscales actualizados",
    successClientUpdated:
      "También se actualizó la dirección guardada del cliente",
  },
  pickerSheet: {
    title: "Selecciona la parada a corregir",
    description:
      "El PAC rechazó el timbrado por RFC inválido. Elige la parada que debes corregir.",
    allStopsDescription:
      "El PAC rechazó el timbrado, pero no se identificó la parada automáticamente. Revisa el RFC de cada parada y corrige la que corresponda.",
    fixAction: "Corregir RFC",
    empty: "No hay paradas disponibles en este contexto. Cierra y vuelve a abrir el detalle del viaje o de la factura.",
  },
  preflightSheet: {
    title: "Revisa el RFC de las paradas",
    description:
      "Hay paradas con RFC faltante o con formato inválido. Corrígelas antes de timbrar para evitar gastar un timbre.",
    fixAction: "Corregir RFC",
    reasonMissing: "RFC faltante",
    reasonInvalid: "RFC con formato inválido",
  },
  stamp: {
    errorTitle: "Error al timbrar",
    fixAction: "Corregir RFC",
    /** `displayOrder` ya es 1-based (usar `toFiscalStopDisplayOrder`). */
    invalidRfcDescription: (displayOrder: number | null) =>
      displayOrder != null
        ? `RFC inválido en parada #${displayOrder}.`
        : "RFC inválido en una parada del viaje.",
    tripLoadFailed:
      "No se pudieron cargar los datos del viaje para validar el RFC. Reintenta timbrar.",
    /**
     * Pre-stamp CP3.1 por datos de Autotransporte / remolques / placas.
     * `detail` suele ser el mensaje de `details[]` del API.
     */
    vehicleIncompleteDescription: (detail?: string) => {
      const base =
        detail?.trim() ||
        "Datos del vehículo incompletos para Carta Porte 3.1.";
      return `${base} Abra Vehículos, edite la unidad asignada al viaje y complete los datos de Carta Porte; luego vuelva a timbrar.`;
    },
  },
  chip: {
    invalidRfc: "Domicilio inválido — Corregir",
    correctFiscal: "Completar domicilio",
  },
  invoiceActions: {
    menuLabel: "Facturación",
    generatePrimary: "Facturar",
    generateFalseTrip: "Facturar viaje en falso",
    generateAccessory: "Facturar servicios adicionales",
    viewPrimary: "Ver factura",
    viewAccessory: (folio: string) =>
      folio ? `Ver factura (${folio})` : "Ver factura adicional",
  },
  invoicesSection: {
    title: "Facturas del viaje",
    primaryLabel: "Flete",
    accessoryLabel: "Adicional",
    folio: (folio: string) => `Folio ${folio}`,
    status: (status: string) => status,
    openInvoice: "Abrir",
    empty: "Aún no hay facturas vinculadas a este viaje.",
    compactTitle: "Facturación",
    openMenuHint: "Gestionar en el menú Facturación",
    goToRouteTab: "Ir a Ruta",
    goToCargoTab: "Ir a Cargas",
  },
  detailBadge: {
    readyToBill: "Listo para facturar",
    pending: "Pendiente",
  },
} as const;
