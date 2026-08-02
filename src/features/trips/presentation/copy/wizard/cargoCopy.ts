/**
 * Namespace: trips.copy.wizard.cargo.*
 *
 * Léxico operativo: el objeto que el usuario registra siempre es «mercancía»
 * (nunca «carga», reservada para la operación de la parada). Voz de usted, sin
 * mayúsculas de alarma y sin vocabulario fiscal o técnico en superficie.
 */
export const cargoCopy = {
  validation: {
    requireCargo:
      "Registre al menos una mercancía en un punto de carga para continuar.",
    requireWeight: "El peso total de las mercancías debe ser mayor a cero.",
    noPickupStops:
      "No hay paradas con operación de carga. Regrese al paso Ruta para configurarlas.",
    pickupWithoutCargo: (stopLabels: string) =>
      `Estas paradas de carga no tienen mercancías registradas: ${stopLabels}`,
    weightExceeded: (
      description: string,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `«${description}»: el peso asignado a entregas (${deliveryWeight} kg) supera el peso de la mercancía (${cargoWeight} kg)`,
    weightPending: (
      description: string,
      pendingWeight: number,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `«${description}»: faltan ${pendingWeight} kg por asignar a puntos de entrega (${deliveryWeight}/${cargoWeight} kg)`,
    implicitDeliverySingle: (cargoName: string) =>
      `La mercancía «${cargoName}» no tiene punto de entrega asignado. Se entregará en la única parada de descarga del viaje.`,
    implicitDeliveryMultiple: (cargoNames: string) =>
      `Las mercancías ${cargoNames} no tienen punto de entrega asignado. Se entregarán en la única parada de descarga del viaje.`,
    missingDeliveryPoints: (
      cargoNames: string,
      isSingle: boolean,
      deliveryStopCount: number,
    ) =>
      `${isSingle ? "La mercancía" : "Las mercancías"} ${cargoNames} ${isSingle ? "no tiene" : "no tienen"} punto de entrega asignado. La ruta tiene ${deliveryStopCount} paradas de descarga, indique en cuál ${isSingle ? "se entregará" : "se entregarán"}.`,
  },
  format: {
    stopPickupLabel: (index: number, label: string) =>
      `Parada ${index + 1} (${label})`,
    quotedName: (name: string) => `«${name}»`,
    stopLabel: (stopIndex: number, locationName: string, address: string) =>
      `Parada ${stopIndex + 1} · ${locationName || address}`,
    stopFallback: (stopIndex: number) => `Parada ${stopIndex + 1}`,
    cargoFallback: (index: number) => `Mercancía ${index + 1}`,
    weight: (weightKg: number) => {
      if (weightKg >= 1000) {
        return `${(weightKg / 1000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} t`;
      }
      return `${weightKg.toLocaleString("es-MX")} kg`;
    },
    weightKg: (kg: number) => `${kg} kg`,
    units: (units: number, unitName: string) =>
      `${units.toLocaleString("es-MX")} ${unitName || "unidades"}`,
    deliveryBadge: (
      stopLabel: string,
      weight?: number | null,
      units?: number | null,
    ) => {
      let text = `Entrega en ${stopLabel}`;
      if (weight != null) text += ` · ${weight} kg`;
      if (units != null) text += ` · ${units} unidades`;
      return text;
    },
    summaryCargos: (totalCargos: number, pickupStops: number) =>
      `${totalCargos} mercancía${totalCargos !== 1 ? "s" : ""} en ${pickupStops} punto${pickupStops !== 1 ? "s" : ""} de carga`,
    summaryWeightTotal: (formatted: string) => ` · ${formatted} en total`,
    stopWithoutCargoItem: (
      stopIndex: number,
      locationName: string,
      city: string,
    ) => `Parada ${stopIndex + 1}: ${locationName} (${city})`,
  },
  section: {
    merchandiseTrip: "Mercancías del viaje",
  },
  hint: {
    merchandiseTrip:
      "Cada punto de carga agrupa sus mercancías. Puede asignar entregas parciales a otras paradas con descarga.",
  },
  hintLabel: {
    merchandiseTrip: "Mercancías del viaje",
  },
  alert: {
    noPickupStops: {
      title: "Ninguna parada tiene operación de carga",
      body: "Regrese al paso Ruta y marque la operación de carga en al menos una parada para registrar mercancías.",
    },
    stopsWithoutCargo: {
      titleSingle: "Falta registrar mercancía en 1 parada de carga",
      titleMultiple: (count: number) =>
        `Falta registrar mercancía en ${count} paradas de carga`,
      footer:
        "Cada parada de carga necesita al menos una mercancía para continuar.",
    },
  },
  capacity: {
    title: "Peso cargado",
    unknownTitle: "Sin capacidad registrada para esta unidad",
    unknownBody:
      "No podremos avisarle si el peso de las mercancías supera lo que admite la unidad.",
    overCapacityHint:
      "Reduzca el peso de las mercancías o elija otra unidad en el paso Información.",
    usage: (percentage: number) => `${percentage.toFixed(0)} % ocupado`,
    loadedOfCapacity: (loaded: string, capacity: string) =>
      `${loaded} de ${capacity}`,
    available: (formatted: string) => `Quedan ${formatted}`,
    excess: (formatted: string) => `Se pasa por ${formatted}`,
    vehicleSubtitle: (unitNumber: string, brand: string, model: string) =>
      `${unitNumber} · ${brand} ${model}`,
  },
  stopCard: {
    stopNumber: (index: number) => `Parada ${index + 1}`,
    origin: "Origen",
    destination: "Destino",
    waypoint: "Escala",
    noMerchandise: "Sin mercancía",
    clientPrefix: "Cliente:",
    emptyTitle: "Todavía no hay mercancías en esta parada",
    emptyHint: "Registre al menos una para poder continuar.",
    summary: (count: number, weightFormatted: string) =>
      `${count} mercancía${count !== 1 ? "s" : ""} · ${weightFormatted}`,
  },
  badge: {
    hazmatTrip: "El viaje lleva material peligroso",
    hazmatShort: "Material peligroso",
    insured: "Asegurada",
  },
  action: {
    addMerchandise: "Agregar mercancía",
    addAnotherMerchandise: "Agregar otra mercancía",
    editMerchandise: "Editar mercancía",
    removeMerchandise: "Quitar mercancía",
  },
  sheet: {
    title: {
      create: "Agregar mercancía",
      edit: "Editar mercancía",
    },
    description:
      "Registro de una mercancía: qué se transporta, cuánto, y opcionalmente seguro, entregas y notas.",
    context: {
      stopPrefix: "Se carga en",
      registeredHere: (count: number) =>
        count === 1
          ? "1 mercancía registrada aquí"
          : `${count} mercancías registradas aquí`,
      noneRegisteredHere: "Sin mercancías registradas aquí",
      available: (formatted: string) => `Quedan ${formatted} en la unidad`,
      overCapacity: (formatted: string) =>
        `La unidad ya va excedida por ${formatted}`,
    },
    section: {
      product: "Qué se transporta",
      quantity: "Cuánto se transporta",
      requirements: "Requisitos del producto",
      insurance: "Seguro de la mercancía",
      deliveries: "Entregas en la ruta",
      notes: "Notas para la operación",
    },
    sectionSummary: {
      insuranceOn: (insurer?: string) =>
        insurer ? `Asegurada con ${insurer}` : "Asegurada",
      insuranceOff: "Sin seguro declarado",
      deliveriesAssigned: (count: number) =>
        count === 1 ? "1 entrega asignada" : `${count} entregas asignadas`,
      deliveriesNone: "Se entrega en el destino del viaje",
      notesFilled: "Con indicaciones para el operador",
      notesEmpty: "Sin indicaciones",
    },
    label: {
      product: "Producto transportado",
      description: "Descripción de la mercancía",
      unit: "Unidad de medida",
      units: "Cantidad",
      weight: "Peso total (kg)",
      isInsured: "Esta mercancía está asegurada",
      declaredValue: "Valor declarado (MXN)",
      insurer: "Aseguradora",
      policy: "Número de póliza",
      isHazmat: "Esta mercancía es material peligroso",
      hazmatCode: "Clave del material peligroso",
      packagingType: "Tipo de embalaje",
      packagingDescription: "Descripción del embalaje",
      notes: "Notas",
      specialInstructions: "Instrucciones especiales",
      expiryDate: "Fecha de caducidad",
      deliveryStop: "Parada de entrega",
      deliveryWeight: "Peso a entregar (kg)",
      deliveryUnits: "Cantidad a entregar",
    },
    placeholder: {
      units: "0",
      weight: "0.00",
      declaredValue: "0.00",
      insurer: "Ej.: Qualitas",
      policy: "Ej.: CARGA-123456",
      packagingType: "Seleccione el tipo de embalaje",
      packagingDescription: "Ej.: bidones de 20 L, tanque de 1000 L…",
      description: "Se completa al elegir el producto; puede ajustarla",
      deliveryStop: "Seleccione la parada…",
      notes: "Observaciones sobre esta mercancía…",
      specialInstructions: "Manejo especial, temperatura, fragilidad…",
    },
    hint: {
      product: "Búsquelo por nombre o por clave en el catálogo de mercancías.",
      description:
        "Se completa al elegir el producto; ajústela si necesita más detalle operativo.",
      unit: "Se conserva tal cual en los documentos del viaje.",
      insurance:
        "Capture la aseguradora y la póliza que cubren esta mercancía en el viaje.",
      hazmatRequired: "El producto elegido obliga a declararla así.",
      requirements: "El producto elegido exige estos datos.",
      requirementsOptional:
        "Estos datos no son obligatorios para el producto elegido.",
      deliveries:
        "Indique en qué paradas se descarga esta mercancía. Si la entrega es parcial, capture el peso o la cantidad de cada punto.",
      pendingFields: "Datos pendientes:",
    },
    state: {
      noDeliveries:
        "Sin entregas asignadas. Puede asignarlas ahora o más adelante.",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      add: "Agregar mercancía",
      addAnother: "Guardar y agregar otra",
      addDelivery: "Agregar entrega",
      showAllProductFields: "Agregar más datos de este producto",
      hideExtraProductFields: "Ocultar datos adicionales",
    },
    validation: {
      missingRequiredTitle: "Faltan datos para guardar la mercancía",
    },
    toast: {
      hazmatRequiredTitle: "No se puede desmarcar",
      hazmatRequiredBody:
        "El producto elegido obliga a declarar esta mercancía como material peligroso.",
      addedTitle: "Mercancía agregada",
      addedBody: (description: string) =>
        `«${description}» quedó registrada en esta parada.`,
    },
    format: {
      deliveryStopOption: (
        index: number,
        locationName: string,
        address: string,
        city: string,
      ) => `Parada ${index + 1} · ${locationName || address} (${city})`,
      capacityProjection: (
        projected: string,
        capacity: string,
        percentage: number,
      ) => `Con esta mercancía: ${projected} de ${capacity} (${percentage.toFixed(0)} %)`,
      availableWeight: (formatted: string) =>
        `Quedan ${formatted} disponibles en la unidad.`,
      overCapacityWeight: (formatted: string) =>
        `Se pasa por ${formatted} de lo que admite la unidad.`,
    },
    capacityAlert: {
      exceededTitle: "El peso supera lo que admite la unidad",
      nearTitle: "La unidad queda casi al límite",
    },
    sectorLabel: {
      sectorCofepris: "Sector COFEPRIS",
      nombreIngredienteActivo: "Ingrediente activo",
      nomQuimico: "Nombre químico",
      denominacionGenericaProd: "Denominación genérica",
      denominacionDistintivaProd: "Denominación distintiva",
      fabricante: "Fabricante",
      loteMedicamento: "Lote de medicamento",
      formaFarmaceutica: "Forma farmacéutica",
      condicionesEspTransp: "Condiciones especiales de transporte",
      registroSanitarioFolioAutorizacion:
        "Registro sanitario o folio de autorización",
      permisoImportacion: "Permiso de importación",
      folioImpoVucem: "Folio de importación VUCEM",
      numCas: "Número CAS",
      razonSocialEmpImp: "Razón social de la empresa importadora",
      numRegSanPlagCofepris: "Registro sanitario de plaguicida COFEPRIS",
      datosFabricante: "Datos del fabricante",
      datosFormulador: "Datos del formulador",
      datosMaquilador: "Datos del maquilador",
      usoAutorizado: "Uso autorizado",
    },
  },
} as const;
