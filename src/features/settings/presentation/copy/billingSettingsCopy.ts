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
      "Deja lista a tu empresa para emitir facturas y consulta aquí si sigue lista.",
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
      "Tu sello está vigente, tu numeración está definida y el timbrador respondió correctamente.",
    descriptionReadyUnverified:
      "Tu sello está vigente y tu numeración está definida: ya puedes emitir facturas.",
    descriptionAttention:
      "Renueva tu sello ante el SAT antes de que venza: sin él no puedes emitir facturas.",
    descriptionPending:
      "Resuelve lo que aparece abajo para poder emitir tu primera factura.",
    requirements: {
      certificate: "Sello digital de tu empresa",
      numbering: "Numeración de tus facturas",
      connection: "Conexión con el timbrador",
      emitter: "Alta de tu empresa ante el timbrador",
    },
    certificate: {
      missing: "Falta cargarlo",
      expired: "Venció el {date}",
      expiring: "Vence el {date}",
      valid: "Vigente hasta el {date}",
      validNoDate: "Cargado",
    },
    numbering: {
      missing: "Falta definirla",
      ready: "Serie {serie}",
    },
    checksHeading: "Comprobaciones opcionales",
    checksHint:
      "Tu empresa se da de alta sola cuando guardas tus datos o cargas el sello. Usa estas comprobaciones solo si algo falla al facturar.",
    check: {
      unknownConnection: "Puedes comprobarla cuando quieras",
      unknownEmitter: "Se hace sola al guardar tus datos",
      running: "Comprobando…",
      ok: "Correcta",
      okEmitter: "Registrada",
      failed: "No se pudo completar",
    },
    ctaCertificate: "Cargar el sello digital",
    ctaNumbering: "Definir la numeración",
    ctaConnection: "Comprobar la conexión",
    ctaEmitter: "Dar de alta tu empresa",
    pendingListTitle: "Para completar el alta falta:",
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
    registerEmitter: "Dar de alta tu empresa",
    registeringEmitter: "Dando de alta…",
    registerHint:
      "Tu empresa se da de alta sola cuando guardas tus datos o cargas el sello. Reintenta aquí solo si el timbrador rechaza tus facturas.",
    connectionOkTitle: "La conexión funciona",
    connectionFailedTitle: "No se pudo conectar",
    emitterOkTitle: "Tu empresa quedó dada de alta",
    emitterFailedTitle: "No se pudo completar el alta",
    /** D3 — nunca decir "prerequisitos": nombrar lo que falta. */
    emitterReasons: {
      missing_rfc:
        "Falta el RFC de tu empresa. Complétalo en Datos generales.",
      missing_csd: "Falta cargar el sello digital de tu empresa.",
      missing_csd_password:
        "Falta la contraseña del sello. Vuelve a cargarlo capturando su contraseña.",
      provider_not_profact:
        "El timbrador configurado no permite dar de alta la empresa desde aquí.",
      register_failed:
        "El timbrador rechazó el alta. Vuelve a intentarlo en unos minutos.",
    } as Record<string, string>,
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
    emitterOk: "Tu empresa quedó dada de alta ante el timbrador",
    emitterFailed: "No se pudo completar el alta",
    emitterError: "No se pudo completar el alta",
    emitterErrorDescription: "Vuelve a intentarlo en unos minutos.",
  },
} as const;
