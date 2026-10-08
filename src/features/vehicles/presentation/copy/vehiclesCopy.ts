/**
 * Namespace: vehicles.copy.detail.*
 * Copy del detalle de vehículo (header, capacidades, tabs, alertas).
 */
export const vehiclesCopy = {
  detail: {
    title: {
      fallback: "Vehículo",
    },
    state: {
      notFoundTitle: "Vehículo no encontrado",
      notFoundDescription: "La unidad que buscas no existe en tu flota.",
      backToList: "Volver a vehículos",
    },
    deactivated: {
      title: "Unidad dada de baja",
      when: (date: string, by: string | null) =>
        by ? `El ${date} por ${by}.` : `El ${date}.`,
      reason: (label: string, note: string | null) =>
        note
          ? `Motivo: ${label} — ${note}${/[.!?]$/.test(note) ? "" : "."}`
          : `Motivo: ${label}.`,
      reasonNotRecorded: "sin registrar",
      impact:
        "No aparece en el padrón ni puede asignarse a viajes. Sus viajes y facturas anteriores no cambian.",
    },
    stat: {
      mileage: {
        title: "Odómetro",
        description: "Kilometraje actual de la unidad",
      },
      load: {
        title: "Carga útil",
        description: (volumeM3: number | null) =>
          volumeM3 != null
            ? `${volumeM3} m³ de volumen útil`
            : "Capacidad de carga en toneladas",
      },
      fuelTank: {
        title: "Tanque",
        description: "Capacidad del depósito de combustible",
      },
      efficiency: {
        title: "Rendimiento",
        description: "Consumo esperado de referencia",
      },
    },
    tab: {
      unit: "Unidad",
      documents: "Documentos",
    },
    alert: {
      documentsExpiredTitle: "Documentos vencidos",
      documentsExpiringTitle: "Documentos por vencer",
      insuranceLabel: "Seguro RC",
      sctLabel: "Permiso SCT",
      expired: "Vencido",
      expiresIn: (days: number) => `Vence en ${days} días`,
    },
    section: {
      unitData: {
        title: "Datos de la unidad",
        description:
          "Información complementaria a la identificación del encabezado.",
      },
      operationalExpenses: {
        title: "Gasto operativo del mes",
        description:
          "Gastos de viaje aprobados asociados a esta unidad en el mes en curso.",
        trips: (count: number) =>
          `${count} viaje${count === 1 ? "" : "s"} con gasto aprobado`,
        empty: "Sin gastos aprobados en el periodo.",
        viewAnalysis: "Ver análisis de gastos",
      },
      permitConfig: {
        title: "Permiso y configuración",
        description:
          "Datos base de la unidad para operación en ruta; pueden ajustarse por viaje.",
        groupPermit: "Permiso y configuración",
        groupOptionalInsurance: "Seguros adicionales",
        optionalInsuranceHint:
          "Valores predeterminados de la unidad; pueden variar por viaje.",
        cargoInsuranceFootnote:
          "El seguro de mercancía se captura por carga en el viaje, no en el vehículo.",
      },
      documents: {
        title: "Documentación vigente",
        description:
          "Seguro de responsabilidad civil y permiso SCT. Los vencimientos se resaltan arriba.",
        groupRc: "Responsabilidad civil",
        groupSct: "Permiso SCT",
      },
    },
    label: {
      vin: "VIN",
      color: "Color",
      volumeCapacity: "Volumen útil",
      baseBranch: "Sucursal base",
      tipoPermiso: "Tipo de permiso SCT",
      configVehicular: "Configuración vehicular",
      pesoBruto: "Peso bruto vehicular",
      insuranceCompany: "Aseguradora RC",
      insurancePolicy: "Póliza RC",
      sctPermitNumber: "Número de permiso SCT",
      aseguraMedioAmbiente: "Aseguradora medio ambiente",
      polizaMedioAmbiente: "Póliza medio ambiente",
    },
    hint: {
      empty: "Sin registrar",
      emptyOptional: "No especificado",
      catalogLoading: "Cargando descripción…",
      trailerAssignedOnTrip:
        "Si esta configuración usa remolque, se elige al crear el viaje.",
    },
    format: {
      headerSubtitle: (typeLabel: string, licensePlate: string) =>
        `${typeLabel} · ${licensePlate}`,
      vehicleLine: (brand: string, model: string, year: number) =>
        `${brand} ${model} (${year})`,
      statLoad: (tons: number) => `${tons} t`,
      statFuel: (liters: number) => `${liters} L`,
      statEfficiency: (kmPerLiter: number) => `${kmPerLiter} km/L`,
      statMileage: (km: number) =>
        `${new Intl.NumberFormat("es-MX").format(km)} km`,
      pesoBruto: (ton: number) =>
        `${new Intl.NumberFormat("es-MX", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3,
        }).format(ton)} t`,
      volume: (m3: number) => `${m3} m³`,
    },
  },
  list: {
    page: {
      title: "Vehículos",
      description: "Gestión de la flota vehicular",
      descriptionManager:
        "Si patio no halló la unidad, dala de alta aquí.",
      refreshSuccess: "Lista actualizada",
    },
    actions: {
      create: "Nuevo Vehículo",
      import: "Importar",
      importAria: "Importar vehículos desde archivo",
      clearFilters: "Limpiar filtros",
    },
    filter: {
      showFilters: "Filtros",
      searchPlaceholder: "Unidad, placa, marca o VIN",
      statusLabel: "Estado",
      statusAll: "Todos",
      typeLabel: "Tipo",
      typeAll: "Todos",
    },
    table: {
      branch: "Sucursal",
    },
    filters: {
      branch: "Sucursal",
      allBranches: "Todas las sucursales",
      chipBranch: (label: string) => `Sucursal: ${label}`,
    },
    chip: {
      status: (label: string) => `Estado: ${label}`,
      type: (label: string) => `Tipo: ${label}`,
    },
    empty: {
      title: "No se encontraron vehículos",
      descriptionClear: "Comienza agregando tu primer vehículo",
      descriptionClearManager:
        "Patio no halló la unidad. Dala de alta aquí.",
      descriptionReadonly:
        "Aún no hay vehículos. Pide el alta a administración.",
      descriptionFiltered:
        "Nada coincide. Prueba otra unidad, placa o VIN, o limpia los recortes.",
    },
    deactivatedView: {
      label: "Dadas de baja",
      aria: "Ver unidades dadas de baja",
      chip: "Vista: dadas de baja",
      emptyTitle: "No hay unidades dadas de baja.",
    },
  },
  lifecycle: {
    deactivatedBadge: "Dada de baja",
    viewDetail: "Ver detalles",
  },
  /** PRD D2/D3 — diálogo «Dar de baja». */
  deactivate: {
    action: "Dar de baja",
    title: (unitNumber: string) => `¿Dar de baja la unidad ${unitNumber}?`,
    description:
      "La unidad saldrá del padrón y ya no podrá asignarse a viajes. Su historial (viajes, Carta Porte, facturas, mantenimiento y documentos) se conserva. Puedes restaurarla después desde «Dadas de baja».",
    outOfServiceHint:
      "¿Solo estará detenida un tiempo? Usa «Cambiar estado → Fuera de servicio».",
    reasonLabel: "Motivo de la baja",
    reasonPlaceholder: "Selecciona un motivo",
    reasonRequired: "Selecciona el motivo de la baja",
    noteLabel: "Nota",
    notePlaceholder: "Ej. vendida a Transportes X, factura 1234",
    noteOptionalHint: "Opcional.",
    noteRequiredHint: "Obligatoria con el motivo «Otro».",
    noteRequired: "Escribe una nota cuando el motivo es «Otro»",
    noteMax: "La nota no puede exceder 500 caracteres",
    validationSummary: "Revisa los datos de la baja",
    cancel: "Cancelar",
    confirm: "Dar de baja",
    submitting: "Dando de baja…",
    successToast: (unitNumber: string) => `Unidad ${unitNumber} dada de baja`,
    errorTitle: "No se pudo dar de baja",
    activeTrips: {
      title: "No se puede dar de baja: la unidad está en viajes activos.",
      lead: "Reasigna la flota o cancela estos viajes y vuelve a intentar:",
      more: (count: number) => `(y ${count} más)`,
      goToTrips: "Ir a Viajes",
    },
  },
  /** PRD D6 — confirmación «Restaurar». */
  restore: {
    action: "Restaurar",
    title: (unitNumber: string) => `¿Restaurar la unidad ${unitNumber}?`,
    descriptionLead: "Volverá al padrón como",
    descriptionStatus: "Disponible",
    descriptionTail: "y podrá asignarse a viajes.",
    cancel: "Cancelar",
    confirm: "Restaurar",
    submitting: "Restaurando…",
    successToast: (unitNumber: string) => `Unidad ${unitNumber} restaurada`,
    successDescription: "Volvió al padrón como Disponible.",
    branchClearedTitle: (unitNumber: string) =>
      `Unidad ${unitNumber} restaurada sin sucursal`,
    branchClearedHint: "Asígnale una desde Editar.",
    errorTitle: "No se pudo restaurar",
    conflictUnitNumber: (unitNumber: string) =>
      `No se puede restaurar: el número económico ${unitNumber} ya lo usa otra unidad activa.`,
    conflictLicensePlate: (licensePlate: string) =>
      `No se puede restaurar: la placa ${licensePlate} ya la usa otra unidad activa.`,
    conflictViewUnit: "Ver unidad",
    conflictHint: "Cambia ese dato en la otra unidad y vuelve a intentar.",
    notOperable: (detail: string) =>
      `No se puede restaurar: a la unidad le faltan datos para operar (${detail}).`,
  },
  form: {
    edit: {
      title: "Editar vehículo",
      subtitle: (
        unitNumber: string,
        typeLabel: string,
        licensePlate: string,
        brand: string,
        model: string,
        year: number,
      ) =>
        `${unitNumber} · ${typeLabel} · ${licensePlate} · ${brand} ${model} (${year})`,
      toast: {
        successTitle: "Vehículo actualizado",
        successDescription: "Los cambios se guardaron correctamente.",
        errorTitle: "No se pudo guardar",
      },
      identityBanner: {
        title: "Número de unidad fijo",
        description:
          "El identificador interno de la unidad no se puede cambiar después del alta. Actualiza placa, especificaciones y datos SAT en las secciones siguientes.",
        viewDetail: "Ver detalle del vehículo",
      },
    },
    create: {
      submit: "Registrar vehículo",
    },
    section: {
      identification: {
        title: "Identificación",
        description: "Placa, VIN y datos básicos de la unidad en flota.",
      },
      characteristics: {
        title: "Características",
        description: "Marca, modelo, tipo y odómetro registrado en sistema.",
      },
      capacities: {
        title: "Capacidades",
        description: "Carga útil, volumen, tanque y rendimiento de referencia.",
      },
      documentation: {
        title: "Documentación y seguros",
        description:
          "Póliza RC, permiso SCT y vencimientos para operación y Carta Porte.",
        groupRc: "Responsabilidad civil",
        groupSct: "Permiso SCT",
      },
      cartaPorte: {
        title: "Carta Porte 3.1 — Autotransporte",
        description:
          "Datos SAT base del autotransporte; la operación puede ajustarlos por viaje.",
        groupVehicleId: "Identificación vehicular",
        groupOptionalInsurance:
          "Seguros adicionales predeterminados (opcionales)",
        optionalInsuranceHint:
          "Valores base del vehículo; un viaje o carga puede usar otro seguro.",
        cargoInsuranceFootnote:
          "El seguro de mercancía se captura por carga en el viaje, no en el vehículo.",
      },
      review: {
        title: "Revisión",
        description:
          "Confirma los datos antes de registrar el vehículo en flota.",
      },
    },
    label: {
      unitNumber: "Número de unidad",
      licensePlate: "Placa",
      vin: "VIN / serie",
      brand: "Marca",
      model: "Modelo",
      year: "Año modelo",
      type: "Tipo de vehículo",
      color: "Color",
      baseBranch: "Sucursal base",
      currentMileage: "Odómetro actual",
      loadCapacity: "Carga útil (t)",
      volumeCapacity: "Volumen útil (m³)",
      fuelTankCapacity: "Tanque (L)",
      expectedFuelEfficiency: "Rendimiento (km/L)",
      insuranceCompany: "Aseguradora RC",
      insurancePolicy: "Póliza RC",
      insuranceExpiry: "Vencimiento del seguro",
      satTipoPermiso: "Tipo de permiso SCT",
      sctPermitNumber: "Número de permiso SCT",
      sctPermitExpiry: "Vencimiento del permiso",
      satConfig: "Configuración vehicular",
      pesoBruto: "Peso bruto vehicular (t)",
      aseguraMedioAmbiente: "Aseguradora medio ambiente",
      polizaMedioAmbiente: "Póliza medio ambiente",
      line: "Línea",
      reviewUnit: "Número de unidad",
      reviewPlate: "Placa",
      reviewBrandModel: "Marca / modelo / año",
      reviewType: "Tipo",
      reviewMileage: "Odómetro actual",
      reviewSct: "Permiso SCT / número",
    },
    placeholder: {
      unitNumber: "Ej. U-001",
      licensePlate: "Ej. ABC123A",
      vin: "Número de serie del vehículo",
      brand: "Ej. Kenworth",
      model: "Ej. T680",
      color: "Ej. blanco",
      currentMileage: "Opcional — 0 si es unidad nueva",
      loadCapacity: "Ej. 28.5",
      volumeCapacity: "Ej. 120",
      fuelTankCapacity: "Ej. 750",
      expectedFuelEfficiency: "Ej. 2.8",
      insuranceCompany: "Ej. Qualitas, GNP, HDI",
      insurancePolicy: "Número de póliza",
      sctPermitNumber: "Número de permiso",
      selectType: "Seleccionar tipo",
      selectPermiso: "Seleccionar tipo de permiso",
      selectConfig: "Seleccionar configuración",
      selectBranch: "Seleccionar sucursal",
      optionalInsurer: "Aseguradora por defecto",
      optionalPolicy: "Póliza por defecto",
    },
    hint: {
      reviewEmpty: "Sin registrar",
      reviewMileageDefault: "Sin captura (se registrará 0 km)",
      trailerAssignedOnTrip:
        "Si esta configuración usa remolque, se elige al crear el viaje.",
      trailerCatalogPrefix: "Alta en ",
      trailerCatalogLink: "Flota → Remolques",
      noBranches:
        "No hay sucursales activas. Crea una sucursal para asignar la unidad a una base operativa.",
    },
    alert: {
      cartaPorteCreate:
        "Los campos marcados con * son obligatorios para timbrar Carta Porte 3.1. Placa y año se reutilizan en el XML.",
      cartaPorteEdit:
        "Los campos Autotransporte con * son obligatorios para guardar una unidad operable y timbrar Carta Porte 3.1. Placa y año se reutilizan en el XML.",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      saving: "Guardando…",
      createBranch: "Crear sucursal",
    },
    validation: {
      summaryEdit: "Revisa los siguientes campos",
      summaryWizard: "Revisa la información del vehículo",
    },
    state: {
      notFoundTitle: "Vehículo no encontrado",
      notFoundDescription: "La unidad que intentas editar no existe en tu flota.",
      backToList: "Volver a vehículos",
    },
  },
  /**
   * Política de cobro motriz (F1). Frases factuales, sin montos ni preview.
   * Prohibido: $389, IVA, overage, cupo, banda, “tu factura”, calculadora.
   */
  billingPolicy: {
    create:
      "Las unidades de tracción (tracto, tórton, rabón, camioneta) se cobran este mes completo, aunque las registres a mitad de mes.",
    remove:
      "Deja de contar el 1.º del mes siguiente. Este mes no hay crédito.",
    link: "Ver suscripción",
    subscriptionHref: "/settings/subscription",
    utilityNotAssignable:
      "El utilitario no se asigna a viajes; úsalo solo como apoyo.",
  },
} as const;

export type VehiclesCopy = typeof vehiclesCopy;
