/**
 * Copy — Configuración › General (ficha de empresa).
 *
 * Registro operativo: sin nombres de atributos fiscales, tablas ni catálogos.
 * Lo que el usuario necesita saber es cómo se ve su empresa en una factura.
 */

export const generalSettingsCopy = {
  page: {
    sectionTitle: "General",
    fallbackTitle: "Datos de la empresa",
    description: "Así aparece tu empresa en las facturas que emites.",
  },
  state: {
    loadErrorTitle: "No pudimos cargar los datos de la empresa",
    loadErrorDescription: "Revisa tu conexión y vuelve a intentarlo.",
    readOnlyTitle: "Modo solo lectura",
    readOnlyDescription:
      "Tu rol puede consultar los datos de la empresa, pero no editarlos.",
    pendingAddressTitle: "Falta completar el domicilio",
    pendingAddressDescription:
      "El domicilio viene de un formato anterior. Ábrelo y confirma estado, municipio y colonia para dejarlo al día.",
  },
  action: {
    edit: "Editar",
    save: "Guardar cambios",
    saving: "Guardando...",
    cancel: "Cancelar",
  },
  validation: {
    summaryTitle: "Revisa estos campos",
  },
  identity: {
    title: "Identidad",
    description: "Nombre y datos con los que emites facturas.",
    editAction: "Editar identidad",
    sheetTitle: "Editar identidad",
    sheetDescription:
      "Estos datos encabezan cada factura que emite tu empresa.",
    legalName: "Razón social",
    legalNamePlaceholder: "Transportes ABC S.A. de C.V.",
    tradeName: "Nombre comercial",
    tradeNamePlaceholder: "Transportes ABC",
    rfc: "RFC",
    rfcPlaceholder: "ABC123456XYZ",
    taxRegime: "Régimen fiscal",
    taxRegimePlaceholder: "Selecciona el régimen",
    taxRegimeLoading: "Consultando...",
  },
  logo: {
    label: "Logo",
    hint: "PNG, JPG, WebP o SVG, hasta 2 MB. Se ve mejor cuadrado y con fondo transparente.",
    upload: "Subir logo",
    replace: "Cambiar logo",
    remove: "Eliminar",
    previewAlt: "Logo de la empresa",
    unavailable: "Logo no disponible",
    dropHint: "Arrastra una imagen o usa el botón",
    invalidType: "Formato no soportado. Usa PNG, JPG, WebP o SVG.",
    tooLarge: "El archivo es muy grande. Máximo 2 MB.",
    loadFailed: "No se pudo cargar el logo. Intenta subirlo nuevamente.",
    removeTitle: "¿Eliminar el logo?",
    removeDescription:
      "Dejará de aparecer en tus facturas y comprobantes. Puedes volver a subirlo cuando quieras.",
    removeConfirm: "Eliminar",
    removeCancel: "Cancelar",
  },
  address: {
    title: "Domicilio",
    description: "El domicilio que aparece en tus facturas.",
    editAction: "Editar domicilio",
    sheetTitle: "Editar domicilio",
    sheetDescription:
      "El domicilio que aparece en tus facturas y desde el que se calculan tus rutas.",
    notice:
      "Domicilio de tu empresa. Se usa en facturación y en la operación diaria.",
    emptyTitle: "Sin domicilio registrado",
    emptyDescription:
      "Captura el domicilio de tu empresa para poder facturar.",
    emptyAction: "Capturar domicilio",
    street: "Calle y número",
    neighborhoodPostal: "Colonia y código postal",
    municipality: "Municipio",
    state: "Estado",
    reference: "Referencia",
    catalogLoading: "Consultando...",
    issuedFrom: "Facturas emitidas desde",
    issuedFromDifferent: "distinto al domicilio",
    postalCodePrefix: "CP",
  },
  expedition: {
    sectionTitle: "Desde dónde facturas",
    hint: "Código postal que aparece en tus facturas como lugar de emisión. Normalmente es el mismo del domicilio.",
    toggle: "Emito facturas desde otro código postal",
    fieldLabel: "Código postal desde el que emites",
    fieldPlaceholder: "03100",
    sameAsAddress: "Se usará el código postal del domicilio:",
  },
  contact: {
    title: "Contacto",
    description: "Cómo pueden localizar a tu empresa.",
    editAction: "Editar contacto",
    sheetTitle: "Editar contacto",
    sheetDescription: "Datos de contacto que compartes con tus clientes.",
    email: "Correo",
    emailPlaceholder: "contacto@empresa.com",
    phone: "Teléfono",
    phonePlaceholder: "(55) 1234-5678",
    website: "Sitio web",
    websitePlaceholder: "https://www.empresa.com",
  },
} as const;
