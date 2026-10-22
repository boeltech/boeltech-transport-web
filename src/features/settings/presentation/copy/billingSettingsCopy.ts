/**
 * Copy de /settings/billing — puesta a punto para facturar.
 *
 * Criterio de léxico: se conserva el término fiscal cuando nombra un objeto
 * que el usuario debe buscar o entregar (sello digital / CSD, .cer, .key,
 * serie, folio, uso de CFDI). Se elimina cuando nombra un mecanismo interno.
 * El léxico de TI no aparece.
 */

export const billingSettingsCopy = {
  page: {
    sectionTitle: "Datos para facturar",
    title: "Datos para facturar",
    description:
      "Revisa si tu empresa puede emitir facturas y ajusta sello, numeración y precargas.",
  },
  state: {
    readOnlyTitle: "Modo solo lectura",
    readOnlyDescription:
      "Tu rol puede consultar estos datos, pero no editarlos.",
    loadErrorTitle: "No pudimos cargar tus datos de facturación",
    loadErrorDescription: "Revisa tu conexión y vuelve a intentarlo.",
    retry: "Reintentar",
  },
  action: {
    save: "Guardar cambios",
    saving: "Guardando…",
    cancel: "Cancelar",
  },
  validation: {
    summaryTitle: "Revisa estos campos",
  },

  // ── Ficha de preparación ──────────────────────────────────────────────────
  readiness: {
    sectionLabel: "Preparación para facturar",
    badgeReady: "Listo",
    badgePending: "Falta algo",
    badgeAttention: "Requiere atención",
    titleReady: "Listo para facturar",
    titleReadyUnverified: "Tus datos están completos",
    titleAttention: "Tu sello digital está por vencer",
    titlePending: "Falta algo para poder facturar",
    descriptionReady:
      "Identidad, sello y numeración están en orden; el timbrador respondió correctamente.",
    descriptionReadyUnverified:
      "Identidad, sello y numeración están en orden: ya puedes emitir facturas.",
    descriptionAttention:
      "Renueva tu sello ante el SAT antes de que venza: sin él no puedes emitir facturas.",
    descriptionPending:
      "Completa lo que aparece abajo para poder emitir facturas.",
    requirements: {
      identity: "Identidad fiscal de la empresa",
      certificate: "Sello digital de tu empresa",
      numbering: "Numeración de tus facturas",
      connection: "Conexión con el timbrador",
    },
    identity: {
      missing: "Falta el RFC, la razón social, el régimen o el CP",
      ready: "RFC, régimen y CP listos",
      unknown: "Cargando…",
    },
    certificate: {
      missing: "Falta cargarlo",
      expired: "Venció el {date}",
      expiring: "Vence el {date}",
      valid: "Vigente hasta el {date}",
      validNoDate: "Cargado",
      adminOnly: "Lo carga un administrador",
    },
    numbering: {
      missing: "Falta definirla",
      ready: "Serie {serie}",
    },
    checksHeading: "Diagnóstico del timbrador",
    checksHint:
      "El timbrado funciona con tu sello digital y la conexión de Boeltech con Finkok. Si algo falla al facturar, comprueba la conexión aquí.",
    check: {
      unknownConnection: "Puedes comprobarla cuando quieras",
      running: "Comprobando…",
      ok: "Correcta",
      failed: "No se pudo completar",
    },
    ctaIdentity: "Ir a General",
    ctaCertificate: "Cargar el sello digital",
    ctaNumbering: "Definir la numeración",
    ctaConnection: "Comprobar la conexión",
    pendingListTitle: "Para completar el alta falta:",
    expandDiagnostics: "Mostrar diagnóstico",
    collapseDiagnostics: "Ocultar diagnóstico",
  },

  // ── Sello digital ─────────────────────────────────────────────────────────
  certificate: {
    title: "Sello digital de tu empresa (CSD)",
    description:
      "Los dos archivos que el SAT te entrega para firmar tus facturas. Se aplican al momento de cargarlos: no dependen del botón «Guardar cambios».",
    restrictedTitle: "Solo el administrador puede cargar el sello",
    restrictedDescription:
      "Pide a quien administra la cuenta que cargue o renueve los archivos del sello digital.",
    statusConfigured: "Cargado",
    statusExpired: "Vencido",
    statusExpiring: "Por vencer",
    expiryLabel: "Vigencia",
    expiryValue: (date: string) => `Hasta el ${date}`,
    expiryMissing: "Sin cargar",
    expiringWarning:
      "Tramita la renovación ante el SAT con tiempo: cuando el sello vence, dejas de poder facturar.",
    expiredWarning:
      "Tu sello venció. No podrás emitir facturas hasta que cargues uno vigente.",
    certificateFile: "Archivo del certificado (.cer)",
    privateKeyFile: "Archivo de la llave privada (.key)",
    chooseFile: "Elegir archivo",
    password: "Contraseña del sello",
    passwordPlaceholder: "La que definiste al tramitarlo ante el SAT",
    upload: "Cargar sello",
    replace: "Reemplazar sello",
    uploading: "Cargando…",
    validation: {
      certificateRequired: "Selecciona el archivo .cer",
      privateKeyRequired: "Selecciona el archivo .key",
      passwordRequired: "Captura la contraseña del sello",
      extensionCer: "El certificado debe ser un archivo .cer",
      extensionKey: "La llave debe ser un archivo .key",
    },
  },

  // ── Numeración ────────────────────────────────────────────────────────────
  numbering: {
    title: "Numeración de tus facturas",
    description:
      "Con esta serie se emite cada factura que generas, lleve o no carta porte. La serie y el folio son tu control interno: el SAT no impone cómo numerarlos.",
    serie: "Serie",
    serieHint: "Hasta 5 caracteres.",
    firstFolio: "Primer folio",
    firstFolioHint:
      "Solo aplica antes de emitir tu primera factura. Úsalo para continuar la numeración de otro sistema.",
    firstFolioLockedHint:
      "Ya no se puede cambiar: hay facturas emitidas con esta serie. La numeración continúa desde tu última factura.",
    nextFolioLabel: "Siguiente factura",
    nextFolioValue: (serie: string, folio: number) => `${serie}-${folio}`,
    nextFolioUnknown: "No disponible",
  },

  // ── Valores que se precargan ──────────────────────────────────────────────
  defaults: {
    title: "Valores que se precargan al facturar",
    description:
      "Cada factura nueva arranca con estos valores. Puedes cambiarlos factura por factura.",
    expand: "Mostrar precargas",
    collapse: "Ocultar precargas",
    usoCfdi: "Uso de CFDI",
    usoCfdiHint: "Para qué usará tu cliente la factura.",
    formaPago: "Forma de pago",
    formaPagoHint: "Cómo te paga: efectivo, transferencia, tarjeta.",
    metodoPago: "Método de pago",
    metodoPagoHint: "Si se liquida de una vez o en parcialidades.",
    claveProductoServicio: "Clave de producto o servicio",
    claveProductoServicioHint:
      "Para transporte de carga por carretera, la clave habitual es 78101800.",
    claveUnidad: "Clave de unidad",
    claveUnidadHint: "Para servicios de transporte, la clave habitual es E48.",
    moneda: "Moneda",
    monedaPlaceholder: "Elige la moneda",
    monedaHint: "Por ahora solo se admite peso mexicano.",
    monedaOptions: {
      mxn: "Peso mexicano (MXN)",
      usd: "Dólar estadounidense (USD)",
    },
    tasaIva: "Tasa de IVA",
    tasaIvaPlaceholder: "Elige la tasa",
    tasaIvaOptions: {
      general: "16% (general)",
      border: "8% (zona fronteriza)",
      zero: "0% (tasa cero o exento)",
    },
    emptyValue: "Sin definir",
  },

  // ── Timbrado ──────────────────────────────────────────────────────────────
  stamping: {
    title: "Quién timbra tus facturas",
    description:
      "El timbrado lo administra Boeltech. No necesitas capturar credenciales.",
    providerLabel: "Timbrador",
    environmentLabel: "Modo",
    environmentProduction: "Facturas reales",
    environmentSandbox: "Facturas de prueba",
    environmentUnknown: "Se muestra al comprobar la conexión",
    testConnection: "Comprobar conexión",
    testingConnection: "Comprobando…",
    connectionOkTitle: "La conexión funciona",
    connectionFailedTitle: "No se pudo conectar",
  },

  // ── Servicios de cobro ────────────────────────────────────────────────────
  serviceConcepts: {
    title: "Servicios de cobro",
    description:
      "Conceptos que reutilizas al facturar: maniobras, resguardo, estadía y similares.",
    count: (total: number) =>
      total === 1 ? "1 servicio registrado" : `${total} servicios registrados`,
    empty: "Todavía no registras servicios",
    manage: "Administrar servicios",
  },

  extrasHeading: "Más configuración",

  // ── Toasts (mutaciones) ───────────────────────────────────────────────────
  toast: {
    saved: "Datos de facturación actualizados",
    savedDescription: "Los cambios se guardaron correctamente.",
    saveError: "No se pudieron guardar los cambios",
    saveErrorDescription: "Vuelve a intentarlo en unos momentos.",
    certificateUploaded: "Sello digital cargado",
    certificateUploadedDescription: "Ya puedes firmar tus facturas con él.",
    certificateError: "No se pudo cargar el sello digital",
    certificateErrorDescription:
      "Revisa que los archivos y la contraseña sean correctos.",
    connectionOk: "La conexión con el timbrador funciona",
    connectionOkDescription: "Puedes emitir facturas.",
    connectionUnavailable: "Este timbrador todavía no está disponible",
    connectionFailed: "No se pudo conectar con el timbrador",
    connectionFailedDescription: "Vuelve a intentarlo en unos minutos.",
    connectionError: "No se pudo comprobar la conexión",
  },

} as const;
