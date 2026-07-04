/**
 * Namespace: trips.copy.wizard.cargo.*
 */
export const cargoCopy = {
  validation: {
    requireCargo:
      "Agrega al menos una mercancía para construir el nodo Mercancias del comprobante.",
    requireWeight:
      "El peso bruto total de las mercancías debe ser mayor a cero.",
    noPickupStops:
      "No hay paradas con operación de carga. Regrese al paso de Ruta para configurarlas.",
    pickupWithoutCargo: (stopLabels: string) =>
      `Las siguientes paradas de carga no tienen mercancías registradas: ${stopLabels}`,
    weightExceeded: (
      description: string,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `"${description}": el peso total de entregas (${deliveryWeight} kg) excede el peso de la carga (${cargoWeight} kg)`,
    weightPending: (
      description: string,
      pendingWeight: number,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `"${description}": faltan ${pendingWeight} kg por asignar a puntos de entrega (${deliveryWeight}/${cargoWeight} kg)`,
    implicitDeliverySingle: (cargoName: string) =>
      `La carga "${cargoName}" no tiene punto de entrega asignado. Se entregará en la única parada de descarga del viaje.`,
    implicitDeliveryMultiple: (cargoNames: string) =>
      `Las cargas ${cargoNames} no tienen punto de entrega asignado. Se entregarán en la única parada de descarga del viaje.`,
    missingDeliveryPoints: (
      cargoNames: string,
      isSingle: boolean,
      deliveryStopCount: number,
    ) =>
      `${isSingle ? "La carga" : "Las cargas"} ${cargoNames} ${isSingle ? "no tiene" : "no tienen"} puntos de entrega asignados. Existen ${deliveryStopCount} paradas de descarga en la ruta, por lo que debe especificar a cuál ${isSingle ? "se entregará" : "se entregarán"}.`,
  },
  format: {
    stopPickupLabel: (index: number, label: string) =>
      `Parada #${index + 1} (${label})`,
    quotedName: (name: string) => `"${name}"`,
    stopLabel: (stopIndex: number, locationName: string, address: string) =>
      `#${stopIndex + 1} ${locationName || address}`,
    stopFallback: (stopIndex: number) => `Parada #${stopIndex + 1}`,
    cargoFallback: (index: number) => `Carga ${index + 1}`,
    weight: (weightKg: number) => {
      if (weightKg >= 1000) {
        return `${(weightKg / 1000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} t`;
      }
      return `${weightKg.toLocaleString("es-MX")} kg`;
    },
    weightKg: (kg: number) => `${kg} kg`,
    weightLegacy: (weight: number) => `Peso: ${weight} kg`,
    units: (units: number, unitName: string) =>
      `${units} ${unitName || "uds"}`,
    insurance: (name: string) => `Seguro: ${name}`,
    policy: (policy: string) => `Póliza: ${policy}`,
    satCode: (code: string) => `Clave ${code}`,
    deliveryBadge: (
      stopLabel: string,
      weight?: number | null,
      units?: number | null,
    ) => {
      let text = `Entrega: ${stopLabel}`;
      if (weight != null) text += ` · ${weight} kg`;
      if (units != null) text += ` · ${units} uds`;
      return text;
    },
    vehicleSubtitle: (unitNumber: string, brand: string, model: string) =>
      `(${unitNumber} - ${brand} ${model})`,
    maxCapacity: (formatted: string) => `Capacidad máxima: ${formatted}`,
    loaded: (formatted: string) => `Cargado: ${formatted}`,
    available: (formatted: string) => formatted,
    excessAvailable: (formatted: string) => `−${formatted} (excedido)`,
    summaryCargos: (totalCargos: number, pickupStops: number) =>
      `${totalCargos} carga${totalCargos !== 1 ? "s" : ""} en ${pickupStops} punto${pickupStops !== 1 ? "s" : ""} de carga`,
    summaryWeightTotal: (formatted: string) => ` • ${formatted} total`,
    stopWithoutCargoItem: (
      stopIndex: number,
      locationName: string,
      city: string,
    ) => `Parada #${stopIndex + 1}: ${locationName} (${city})`,
    overCapacityBody: (
      totalFormatted: string,
      capacityFormatted: string,
      excessFormatted: string,
    ) =>
      `El peso total de las cargas (${totalFormatted}) excede la capacidad del vehículo (${capacityFormatted}). Exceso: ${excessFormatted}`,
    cargoBreakdownPercentage: (weightFormatted: string, percentage: number) =>
      `${weightFormatted} (${percentage.toFixed(1)}%)`,
  },
  section: {
    merchandise: "Mercancías y movimientos",
    merchandiseTrip: "Mercancías del viaje",
  },
  hint: {
    merchandiseTrip:
      "Cada punto de carga agrupa mercancías; al crear una carga se genera un movimiento de pickup. Puedes asignar entregas parciales hacia otras paradas con descarga.",
  },
  hintLabel: {
    merchandiseTrip: "Mercancías y movimientos",
  },
  alert: {
    noPickupStops: {
      title: "No hay paradas con operación de carga",
      body: 'Regrese al paso de Ruta y asegúrese de que al menos una parada tenga la operación de "Carga" (pickup) para poder registrar mercancías.',
    },
    stopsWithoutCargo: {
      titleSingle: "1 parada de carga sin mercancías registradas",
      titleMultiple: (count: number) =>
        `${count} paradas de carga sin mercancías registradas`,
      footer:
        "Todas las paradas de carga deben tener al menos una mercancía para continuar.",
    },
    overCapacity: {
      title: "¡Capacidad del vehículo excedida!",
      options:
        "Opciones: Reduzca el peso de las cargas o seleccione un vehículo con mayor capacidad en el Paso 1 (Información).",
    },
    noVehicleCapacity: {
      title: "Vehículo sin capacidad de carga definida",
      body: "El vehículo seleccionado no tiene registrada su capacidad de carga. No se podrá validar si las cargas exceden la capacidad del vehículo.",
      footer:
        "Puede continuar, pero se recomienda actualizar la capacidad del vehículo en el módulo de Vehículos.",
    },
  },
  capacity: {
    title: "Capacidad del Vehículo",
    utilized: "utilizado",
    exceeded: "¡EXCEDIDO!",
    loadedLabel: "Cargado:",
    availableLabel: "Disponible:",
    breakdown: "Desglose de cargas:",
  },
  stopCard: {
    stopNumber: (index: number) => `Parada #${index + 1}`,
    origin: "Origen",
    destination: "Destino",
    waypoint: "Escala",
    pickup: "Carga",
    noMerchandise: "Sin mercancías",
    clientPrefix: "Cliente:",
    emptyTitle: "Sin cargas registradas",
    emptyHint: "Debe registrar al menos una carga en esta parada",
  },
  badge: {
    hazmatTrip: "Contiene material peligroso",
    hazmatShort: "Mat. Peligroso",
  },
  action: {
    addMerchandise: "Agregar mercancía",
  },
  sheet: {
    title: {
      create: "Agregar mercancía",
      edit: "Editar mercancía",
    },
    description:
      "Formulario de mercancía: producto y unidad de medida, cantidad y peso, seguro, material peligroso, entregas y observaciones.",
    section: {
      insurance: "Seguro de mercancía",
      hazmat: "Material peligroso",
      sectors: "Sectores regulados",
      deliveries: "Entregas en la ruta",
      notes: "Notas y observaciones",
    },
    label: {
      isInsured: "Esta mercancía está asegurada",
      declaredValue: "Valor declarado (MXN)",
      insurer: "Aseguradora de la carga",
      policy: "Póliza de la carga",
      isHazmat: "Esta mercancía es material peligroso",
      hazmatCode: "Clave Material Peligroso",
      packagingType: "Tipo de Embalaje",
      packagingDescription: "Descripción del Embalaje",
      notes: "Notas",
      specialInstructions: "Instrucciones especiales",
      expiryDate: "Fecha de caducidad",
    },
    placeholder: {
      declaredValue: "0.00",
      insurer: "Ej: Qualitas",
      policy: "Ej: CARGA-123456",
      packagingType: "Seleccionar tipo de embalaje",
      packagingDescription: "Ej: Bidones de 20L, Tanque de 1000L…",
      deliveryStop: "Seleccionar parada…",
      deliveryWeight: "Peso (kg)",
      deliveryUnits: "Unidades",
      notes: "Observaciones sobre la carga…",
      specialInstructions: "Manejo especial, temperatura, fragilidad…",
    },
    hint: {
      insurance:
        "Captura la aseguradora y póliza específicas de esta mercancía para el viaje.",
      hazmatRequired:
        "Este producto obliga captura de material peligroso según catálogo SAT.",
      hazmatComplete:
        "Completa la información de material peligroso según catálogo oficial.",
      sectors:
        "Complete solo los campos regulatorios que marque el catálogo del producto. Si no aplica, puede dejarlos vacíos.",
      deliveriesScope: "Descargas posteriores en otras paradas",
      deliveriesOptional:
        "Opcional: indique en qué paradas se entregará esta mercancía. Para entregas parciales, especifique peso o unidades por punto.",
      pendingSectorFields: "Campos pendientes:",
    },
    state: {
      noDeliveries:
        "Sin entregas asignadas. Puede asignarlas después.",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      add: "Agregar mercancía",
      addDelivery: "Agregar Entrega",
    },
    validation: {
      missingRequiredTitle: "Faltan datos obligatorios en la mercancía",
    },
    toast: {
      hazmatRequiredTitle: "Material peligroso requerido",
      hazmatRequiredBody:
        "El producto seleccionado exige capturar información de material peligroso según catálogo SAT.",
    },
    format: {
      deliveryStopOption: (
        index: number,
        locationName: string,
        address: string,
        city: string,
      ) => `#${index + 1} ${locationName || address} (${city})`,
    },
    sectorLabel: {
      sectorCofepris: "Sector COFEPRIS",
      nombreIngredienteActivo: "Ingrediente activo",
      nomQuimico: "Nombre químico",
      denominacionGenericaProd: "Denominación genérica",
      denominacionDistintivaProd: "Denominación distintiva",
      fabricante: "Fabricante",
      loteMedicamento: "Lote medicamento",
      formaFarmaceutica: "Forma farmacéutica",
      condicionesEspTransp: "Condiciones especiales de transporte",
      registroSanitarioFolioAutorizacion:
        "Registro sanitario / folio autorización",
      permisoImportacion: "Permiso importación",
      folioImpoVucem: "Folio VUCEM",
      numCas: "Número CAS",
      razonSocialEmpImp: "Razón social empresa importadora",
      numRegSanPlagCofepris: "Registro sanitario plaguicida COFEPRIS",
      datosFabricante: "Datos fabricante",
      datosFormulador: "Datos formulador",
      datosMaquilador: "Datos maquilador",
      usoAutorizado: "Uso autorizado",
    },
  },
} as const;
