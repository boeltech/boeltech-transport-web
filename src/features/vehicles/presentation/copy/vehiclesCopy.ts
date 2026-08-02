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
      notFoundDescription:
        "La unidad que buscas no existe o fue eliminada de flota.",
      backToList: "Volver a vehículos",
      inactiveRegistration: "Unidad inactiva",
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
        groupTrailers: "Remolques",
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
      trailerSubtype: "Tipo de remolque",
      trailerPlate: "Placa",
      trailerPosition: (position: number) => `Remolque ${position}`,
      insuranceCompany: "Aseguradora RC",
      insurancePolicy: "Póliza RC",
      sctPermitNumber: "Número de permiso SCT",
      aseguraMedioAmbiente: "Aseguradora medio ambiente",
      polizaMedioAmbiente: "Póliza medio ambiente",
    },
    hint: {
      empty: "Sin registrar",
      emptyOptional: "No especificado",
      noTrailers: "Sin remolques registrados.",
      catalogLoading: "Cargando descripción…",
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
    table: {
      branch: "Sucursal",
    },
    filters: {
      branch: "Sucursal",
      allBranches: "Todas las sucursales",
      chipBranch: (label: string) => `Sucursal: ${label}`,
    },
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
        groupTrailers: "Remolques (máx. 2)",
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
      trailerSubtipo: (index: number) => `Subtipo remolque ${index}`,
      trailerPlate: (index: number) => `Placa remolque ${index}`,
      aseguraMedioAmbiente: "Aseguradora medio ambiente",
      polizaMedioAmbiente: "Póliza medio ambiente",
      line: "Línea",
      reviewUnit: "Número de unidad",
      reviewPlate: "Placa",
      reviewBrandModel: "Marca / modelo / año",
      reviewType: "Tipo",
      reviewMileage: "Odómetro actual",
      reviewSct: "Permiso SCT / número",
      reviewTrailers: "Remolques",
    },
    placeholder: {
      unitNumber: "Ej. U-001",
      licensePlate: "Ej. ABC-123-A",
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
      selectSubtipoRem: "Seleccionar subtipo",
      trailerPlate: "Ej. REM1234",
      selectBranch: "Seleccionar sucursal",
      optionalInsurer: "Aseguradora por defecto",
      optionalPolicy: "Póliza por defecto",
    },
    hint: {
      reviewEmpty: "Sin registrar",
      reviewMileageDefault: "Sin captura (se registrará 0 km)",
      noTrailers: "Sin remolques registrados para esta unidad.",
      noBranches:
        "No hay sucursales activas. Crea una sucursal para asignar la unidad a una base operativa.",
    },
    alert: {
      cartaPorteCreate:
        "Los campos marcados con * son obligatorios para timbrar Carta Porte 3.1. Placa y año se reutilizan en el XML.",
      cartaPorteEdit:
        "Completa los campos vacíos para que la unidad sea timbrable. Placa y año se toman de la identificación.",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      saving: "Guardando…",
      addTrailer: "Agregar remolque",
      removeTrailer: "Quitar remolque",
      createBranch: "Crear sucursal",
    },
    validation: {
      summaryEdit: "Revisa los siguientes campos",
      summaryWizard: "Revisa la información del vehículo",
    },
    state: {
      notFoundTitle: "Vehículo no encontrado",
      notFoundDescription:
        "La unidad que intentas editar no existe o fue eliminada.",
      backToList: "Volver a vehículos",
    },
  },
} as const;

export type VehiclesCopy = typeof vehiclesCopy;
