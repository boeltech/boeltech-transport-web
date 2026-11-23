/**
 * Namespace: trips.copy.wizard.cargo.*
 *
 * Sheet (`cargo.sheet`): léxico «carga» + tuteo (pedido 2026-11-23).
 * El resto del paso Cargas del alta aún dice «mercancía» (deuda diferida).
 * La marca de material peligroso nombra el atributo de la Carta Porte.
 */

/** Marca SAT `1`. También es el aviso si intentan apagar el interruptor. */
const MATERIAL_PELIGROSO_SIEMPRE =
  'Esta clave siempre declara material peligroso: MaterialPeligroso="Sí". Hace falta la clave y el embalaje.';

export const cargoCopy = {
  toast: {
    /** Soft warning F7 al avanzar el paso Cargas con remanente. */
    underAllocatedTitle: "Entregas parciales sin cubrir el total",
  },
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
    /** Soft (D-F7-5): no bloquea avanzar en el wizard. */
    weightPending: (
      description: string,
      pendingWeight: number,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `«${description}»: faltan ${pendingWeight.toLocaleString("es-MX")} kg por asignar a puntos de entrega (${deliveryWeight.toLocaleString("es-MX")}/${cargoWeight.toLocaleString("es-MX")} kg)`,
    unitsExceeded: (
      description: string,
      deliveryUnits: number,
      cargoUnits: number,
    ) =>
      `«${description}»: las unidades de entregas (${deliveryUnits.toLocaleString("es-MX")}) superan las de la mercancía (${cargoUnits.toLocaleString("es-MX")})`,
    /** Soft (D-F7-5): no bloquea avanzar en el wizard. */
    unitsPending: (
      description: string,
      pendingUnits: number,
      deliveryUnits: number,
      cargoUnits: number,
    ) =>
      `«${description}»: faltan ${pendingUnits.toLocaleString("es-MX")} uds por asignar a puntos de entrega (${deliveryUnits.toLocaleString("es-MX")}/${cargoUnits.toLocaleString("es-MX")})`,
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
      create: "Agregar carga",
      edit: "Editar carga",
    },
    description:
      "Registro de una carga: qué se transporta, cuánto, y opcionalmente seguro, entregas y notas.",
    phaseRule: {
      draftOrScheduled: {
        create:
          "En reserva puedes agregar, corregir o eliminar cargas. Recogida y entrega se registran en Seguimiento.",
        edit: "En reserva puedes corregir todo. Recogida y entrega se registran en Seguimiento.",
      },
      inProgress:
        "En ruta solo puedes agregar cargas. Para corregir o eliminar, el viaje debe estar en reserva o programado.",
    },
    context: {
      /** @deprecated Preferir `seCargaEn`. */
      stopPrefix: "Se carga en",
      seCargaEn: (n: number, lugar: string) => `Se carga en ${n} · ${lugar}`,
      editSummary: (
        description: string,
        cantidad: string,
        unidad: string,
        peso: string,
      ) => `${description} · ${cantidad} ${unidad} · ${peso} kg`,
      registeredHere: (count: number) =>
        count === 1
          ? "1 carga registrada aquí"
          : `${count} cargas registradas aquí`,
      noneRegisteredHere: "Sin cargas registradas aquí",
      summaryStopLabel: "En esta parada",
      unitLabel: (economico?: string | null) =>
        economico?.trim() ? `Unidad ${economico.trim()}` : "Unidad",
      unitUnassigned: "Sin asignar",
      availableKg: (x: string) => `Quedan ${x} kg en la unidad`,
      /** @deprecated Preferir `availableKg`. */
      available: (formatted: string) => `Quedan ${formatted} en la unidad`,
      overCapacity: (formatted: string) =>
        `La unidad ya va excedida por ${formatted}`,
    },
    section: {
      product: "Qué se transporta",
      quantity: "Cuánto se transporta",
      where: "Dónde va",
      requirements: "Requisitos del producto",
      insurance: "Seguro de la carga",
      /** @deprecated Preferir `where`. */
      deliveries: "Dónde va",
      notes: "Notas para la operación",
    },
    sectionSummary: {
      whereOk: (pickupN: number, pickupLugar: string, deliveryN: number, deliveryLugar: string) =>
        `Recoge ${pickupN} · ${pickupLugar} → Entrega ${deliveryN} · ${deliveryLugar}`,
      whereMulti: (pickupN: number, pickupLugar: string, deliveryCount: number) =>
        `Recoge ${pickupN} · ${pickupLugar} → ${deliveryCount} entregas`,
      whereMissingPickup:
        "Falta la recogida: elígela para que la carga salga en el viaje",
      requirementsNone: "El producto no exige datos extra",
      requirementsNoHazmat: "Sin material peligroso",
      insuranceOn: (insurer?: string, policy?: string) =>
        insurer
          ? `Asegurada con ${insurer}`
          : policy
            ? `Asegurada · póliza ${policy}`
            : "Asegurada",
      insuranceOff: "Sin seguro declarado",
      deliveriesAssigned: (count: number) =>
        count === 1 ? "1 entrega asignada" : `${count} entregas asignadas`,
      deliveriesNone: "Se entrega en el destino del viaje",
      notesFilled: "Con indicaciones para el operador",
      notesEmpty: "Sin indicaciones",
    },
    label: {
      product: "Producto transportado",
      description: "Descripción de la carga",
      unit: "Unidad de medida",
      units: "Cantidad",
      weight: "Peso total (kg)",
      isInsured: "Esta carga está asegurada",
      declaredValue: "Valor declarado (MXN)",
      insurer: "Aseguradora",
      policy: "Número de póliza",
      isHazmat: "Esta carga es material peligroso",
      hazmatCode: "Clave del material peligroso",
      packagingType: "Tipo de embalaje",
      packagingDescription: "Descripción del embalaje",
      notes: "Notas",
      specialInstructions: "Instrucciones especiales",
      expiryDate: "Fecha de caducidad",
      pickupStop: "Recoge en",
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
      packagingType: "Selecciona el tipo de embalaje",
      packagingDescription: "Ej.: bidones de 20 L, tanque de 1000 L…",
      description: "Se completa al elegir el producto; ajústala si necesitas más detalle.",
      pickupStop: "Selecciona la parada de recogida…",
      deliveryStop: "Selecciona la parada…",
      notes: "Observaciones sobre esta carga…",
      specialInstructions: "Manejo especial, temperatura, fragilidad…",
    },
    hint: {
      product: "Búscalo por nombre o por clave del catálogo del SAT.",
      description:
        "Se completa al elegir el producto; ajústala si necesitas más detalle.",
      unit: "Se conserva tal cual en los documentos del viaje.",
      capacityNoVehicle:
        "Sin unidad asignada: la ocupación se calcula al asignar flota.",
      /** Unidad en el viaje pero sin capacidad conocida en catálogo. */
      capacityNoCapacityKnown:
        "Unidad asignada: captura el peso; la ocupación se calcula cuando la unidad tenga capacidad en el catálogo.",
      capacityMeter: (
        proyectado: string,
        capacidad: string,
        pct: number,
        x: string,
      ) =>
        `${proyectado} de ${capacidad} kg · ${pct.toFixed(0)} % ocupado · Quedan ${x} kg`,
      insurance:
        "Captura la aseguradora y la póliza que cubren esta carga en el viaje.",
      hazmatRequired: MATERIAL_PELIGROSO_SIEMPRE,
      materialPeligrosoOmit:
        "Esta clave no declara material peligroso. El atributo no va en la Carta Porte.",
      materialPeligrosoOptionalOff:
        'Puede ser o no ser material peligroso. Si no lo es, la Carta Porte lleva MaterialPeligroso="No".',
      materialPeligrosoOptionalOn:
        'La Carta Porte llevará MaterialPeligroso="Sí". Captura la clave y el embalaje.',
      materialPeligrosoUnknown:
        "Esta clave todavía no tiene la marca de material peligroso en el catálogo. No se podrá timbrar hasta que el catálogo la tenga.",
      pickupStop:
        "Elige en qué parada de recogida sale esta carga cuando el viaje tiene más de una.",
      requirements: "El producto elegido exige estos datos.",
      requirementsOptional:
        "Estos datos no son obligatorios para el producto elegido.",
      deliveries:
        "Indica en qué paradas se descarga esta carga. Si la entrega es parcial, captura el peso o la cantidad de cada punto y asigna el remanente a otra descarga.",
      /** F5d-c / PRD: ≥2 descargas — tono obligatorio (sin «más adelante»). */
      deliveriesMultiUnload:
        "Con varias descargas, selecciona dónde se entrega esta carga. Si la entrega es parcial, captura el peso o la cantidad de cada punto.",
      deliveriesReadOnly:
        "Las entregas de esta carga no se pueden cambiar aquí. Defínelas al dar de alta la carga.",
      /**
       * Edit/create con 1 sola descarga: CTA «Agregar entrega» oculto (CEO).
       * F5: entrega asumida y materializada por API al guardar / al listar.
       */
      deliveriesSingleUnload:
        "Solo hay una descarga (destino): la entrega se registra ahí al guardar. Para más entregas, agrega otra descarga en Ruta.",
      /** F7: hint dinámico con remanente explícito (D-F7-4). */
      deliveriesRemainder: (remainderLine: string) =>
        `Quedan ${remainderLine} sin asignar a una entrega. Puedes guardar y completar después.`,
      pendingFields: "Datos pendientes:",
    },
    badge: {
      assignOnSave: "Se asigna al guardar",
      uniquePickup: "Única parada de carga",
    },
    alert: {
      underAllocatedTitle: "Falta asignar el resto de la carga",
      underAllocatedBody: (remainderLine: string) =>
        `Faltan ${remainderLine} por asignar a una entrega. Puedes guardar y completar después.`,
      overAllocatedTitle: "Las entregas superan el total de la carga",
      overAllocatedBody: (remainderLine: string) =>
        `Sobran ${remainderLine} respecto al total. Ajusta peso o cantidad antes de guardar.`,
    },
    state: {
      noDeliveries:
        "Sin entregas asignadas. Puedes asignarlas ahora o más adelante.",
      /** F5d-c: empty hard con ≥2 unloads (sin tono diferible). */
      noDeliveriesMultiUnload:
        "Con varias descargas, selecciona dónde se entrega esta carga.",
      /** Empty state cuando CTA oculto (1 unload): no pedirle al operador que asigne. */
      noDeliveriesSingleUnload:
        "La entrega se registrará en el destino al guardar.",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      add: "Agregar carga",
      addAnother: "Guardar y agregar otra",
      addDelivery: "Agregar entrega",
      editSection: "Editar",
      changeProduct: "Cambiar",
      showAllProductFields: "Agregar más datos de este producto",
      hideExtraProductFields: "Ocultar datos adicionales",
    },
    validation: {
      missingRequiredTitle: "Faltan datos para guardar la carga",
      deliveryStopRequired: "Selecciona la parada de cada entrega agregada",
      /** F5d-c hard: ≥2 unloads sin ninguna entrega. */
      deliveryAssignmentRequired:
        "Con varias descargas, selecciona dónde se entrega esta carga.",
      deliveryWeightExceeded: (
        deliveryWeight: number,
        cargoWeight: number,
      ) =>
        `El peso de las entregas (${deliveryWeight.toLocaleString("es-MX")} kg) supera el de la carga (${cargoWeight.toLocaleString("es-MX")} kg)`,
      deliveryUnitsExceeded: (deliveryUnits: number, cargoUnits: number) =>
        `Las unidades de las entregas (${deliveryUnits.toLocaleString("es-MX")}) superan las de la carga (${cargoUnits.toLocaleString("es-MX")})`,
    },
    toast: {
      hazmatRequiredTitle: "No se puede desmarcar",
      hazmatRequiredBody: MATERIAL_PELIGROSO_SIEMPRE,
      addedTitle: "Carga agregada",
      addedBody: (description: string) =>
        `«${description}» quedó registrada en esta parada.`,
      saveErrorTitle: "No se pudo guardar la carga",
      saveErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
    },
    effects: {
      title: "Al confirmar",
      routeLine: (
        pickupN: number,
        pickupLugar: string,
        deliveryN: number,
        deliveryLugar: string,
      ) =>
        `Se recoge en ${pickupN} · ${pickupLugar} y se entrega en ${deliveryN} · ${deliveryLugar}.`,
      fiscalLine:
        "El viaje ya tiene Atención fiscal por el cambio de ruta: esta carga entra en la misma sustitución.",
    },
    format: {
      /** Label corto Operate: `n · {lugar}` (C7 / VIS ancla). */
      deliveryStopOption: (
        index: number,
        locationName: string,
        address: string,
        _city?: string,
      ) => `${index + 1} · ${locationName || address}`,
      assignedMeter: (
        u: string,
        U: string,
        unidad: string,
        w: string,
        W: string,
      ) => `Asignado ${u} de ${U} ${unidad} · ${w} de ${W} kg`,
      capacityProjection: (
        projected: string,
        capacity: string,
        percentage: number,
      ) =>
        `${projected} de ${capacity} (${percentage.toFixed(0)} %)`,
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
