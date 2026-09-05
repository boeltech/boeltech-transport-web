/**
 * Namespace: drivers.copy.detail.*
 * Copy del detalle de conductor (header, capacidades, tabs, alertas).
 */

/** Puesto requerido en BD para alta de conductor — lockstep API `DRIVER_ELIGIBLE_POSITION`. */
export const DRIVER_ELIGIBLE_POSITION = "Conductor" as const;

export const driversCopy = {
  detail: {
    title: {
      fallback: "Conductor",
    },
    state: {
      notFoundTitle: "Conductor no encontrado",
      notFoundDescription:
        "El conductor que buscas no existe o fue eliminado de flota.",
      loadErrorTitle: "No se pudo cargar el conductor",
      loadErrorDescription:
        "Ocurrió un error al obtener los datos. Intenta de nuevo.",
      retry: "Reintentar",
      backToList: "Volver a conductores",
      noEmployeeNumber: "Sin número de empleado",
    },
    stat: {
      federalLicense: {
        title: "Licencia federal",
        description: "Documento de flota / Carta Porte",
      },
      stateLicense: {
        title: "Licencia estatal",
        description: "Complemento opcional",
      },
      medical: {
        title: "Certificado médico",
        description: "Aptitud para operar unidades",
      },
      vigency: {
        valid: "Vigente",
        validHint: "Sin alerta de vencimiento",
        expiring: (days: number) => `Vence en ${days} d`,
        expiringHint: "Dentro de 30 días",
        expired: "Vencida",
        missing: "Sin registrar",
        notApplicable: "No aplica",
      },
    },
    tab: {
      driver: "Perfil",
      documents: "Documentación",
      trips: "Viajes",
    },
    vigency: {
      noDate: "Sin fecha",
      expired: "Vencido",
      expiredShort: "Vencida",
      valid: "Vigente",
      daysRemaining: (days: number) => `${days} días`,
      daysRemainingLong: (days: number) => `${days} días restantes`,
      drugExpired: "Examen vencido",
    },
    alert: {
      licenseLabel: "Licencia",
      federalLicenseLabel: "Licencia federal",
      stateLicenseLabel: "Licencia estatal",
      medicalLabel: "Certificado médico",
      viewDocuments: "Ver documentación",
      rfcMissing: {
        title: "RFC del empleado pendiente",
        body: "El conductor puede asignarse a un viaje. Al timbrar Carta Porte se exige el RFC en el expediente del empleado.",
        chip: "RFC pendiente",
        editEmployee: "Completar en el empleado",
      },
      licenseExpiredText: (daysAgo: number, date: string) =>
        `Vencida hace ${daysAgo} días (${date})`,
      licenseExpiringText: (days: number, date: string) =>
        `Vence en ${days} días (${date})`,
      medicalExpiredText: (daysAgo: number, date: string) =>
        `Vencido hace ${daysAgo} días (${date})`,
      medicalExpiringText: (days: number, date: string) =>
        `Vence en ${days} días (${date})`,
      title: {
        bothExpired: "Licencias y certificado médico vencidos",
        bothExpiring: "Licencias y certificado médico próximos a vencer",
        reviewDocs: "Revisar documentación del conductor",
        licensesExpired: "Licencias federal y estatal vencidas",
        licensesExpiring: "Licencias próximas a vencer",
        federalExpired: "Licencia federal vencida",
        federalExpiring: "Licencia federal próxima a vencer",
        stateExpired: "Licencia estatal vencida",
        stateExpiring: "Licencia estatal próxima a vencer",
        licenseExpired: "Licencia vencida",
        licenseExpiring: "Licencia próxima a vencer",
        medicalExpired: "Certificado médico vencido",
        medicalExpiring: "Certificado médico próximo a vencer",
      },
      drug: {
        expiredTitle: "Vigencia estimada del antidoping vencida",
        expiringTitle: "Antidoping próximo a vencer (180 días)",
        expiredBody: (examDate: string, daysAgo: number) =>
          `Desde el último examen (${examDate}) la vigencia estimada venció hace ${daysAgo} días.`,
        expiringBody: (examDate: string, daysLeft: number) =>
          `Quedan ${daysLeft} días antes de superar el periodo de 180 días desde el último examen (${examDate}).`,
      },
    },
    section: {
      contact: {
        title: "Contacto y base",
        description: "Datos operativos del conductor y su vínculo laboral.",
      },
      operation: {
        title: "Operación y notas",
        description:
          "Dispositivo de rastreo asignado y observaciones internas.",
      },
      emergency: {
        title: "Contacto de emergencia",
        description:
          "Persona a contactar en incidentes; proviene del perfil del empleado.",
      },
      license: {
        title: "Licencias de conducir",
        description:
          "Licencia federal (primaria) y licencia estatal opcional.",
      },
      licenseFederal: {
        title: "Licencia federal",
        description: "Número, categoría A–F y vencimiento.",
      },
      licenseState: {
        title: "Licencia estatal",
        description: "Complemento opcional emitido por entidad federativa.",
      },
      medical: {
        title: "Certificado médico",
        description: "Vigencia del examen médico para operación de unidades.",
      },
      psychometric: {
        title: "Examen psicométrico",
        description: "Último resultado registrado en el expediente.",
      },
      drugTest: {
        title: "Examen antidoping",
        description:
          "Vigencia estimada de 180 días desde la fecha del último examen.",
      },
      trips: {
        title: "Historial de viajes",
        description: "Asignaciones recientes del conductor.",
      },
    },
    label: {
      employee: "Empleado",
      employeeNumber: "Número de empleado",
      email: "Correo electrónico",
      phone: "Teléfono",
      branch: "Sucursal base",
      viewEmployee: "Ver perfil del empleado",
      gpsDevice: "Dispositivo GPS",
      notes: "Notas",
      licenseExpiry: "Fecha de vencimiento",
      licenseState: "Estado emisor",
      federalLicenseNumber: "Número de licencia federal",
      federalLicenseCategory: "Categoría (A–F)",
      federalLicenseExpiry: "Vencimiento federal",
      stateLicenseNumber: "Número de licencia estatal",
      stateLicenseExpiry: "Vencimiento estatal",
      stateIssuingState: "Estado emisor",
      medicalNumber: "Número de certificado",
      medicalExpiry: "Fecha de vencimiento",
      medicalIssuer: "Institución emisora",
      bloodType: "Tipo de sangre",
      psychometricDate: "Fecha del examen",
      psychometricResult: "Resultado",
      drugTestDate: "Fecha del último examen",
      drugTestResult: "Resultado",
      drugEstimatedExpiry: "Vigencia estimada",
      emergencyName: "Nombre",
      emergencyPhone: "Teléfono",
      emergencyRelationship: "Parentesco",
      tripVehicle: "Unidad",
      tripClient: "Cliente",
    },
    hint: {
      empty: "Sin registrar",
      emptyOptional: "No especificado",
      noDevice: "Sin dispositivo asignado",
      noNotes: "Sin notas",
      noEmergencyContact: "No hay contacto de emergencia registrado.",
      emergencyFromEmployee:
        "Captura o actualiza este dato en el perfil del empleado.",
    },
    jurisdiction: {
      federal: "Federal",
      state: "Estatal",
      both: "Federal + estatal",
      stateOnly: "Solo estatal",
    },
    action: {
      loadMoreTrips: "Cargar más",
      loadingMoreTrips: "Cargando…",
    },
    format: {
      employeeLine: (employeeNumber: string) => `No. empleado ${employeeNumber}`,
      licenseLine: (typeLabel: string, licenseNumber: string) =>
        typeLabel
          ? `${typeLabel} · ${licenseNumber}`
          : licenseNumber,
      tripsTab: (total: number) => `Viajes (${total})`,
      tripMeta: (vehicleLabel: string, clientLabel: string | null) =>
        clientLabel
          ? `${vehicleLabel} · ${clientLabel}`
          : vehicleLabel,
    },
    trips: {
      loadError: "No se pudo cargar el historial de viajes. Intenta de nuevo.",
      empty: "Este conductor aún no tiene viajes registrados.",
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
    jurisdiction: {
      federal: "Federal",
      state: "Solo estatal",
      both: "Federal + estatal",
    },
  },
  form: {
    edit: {
      title: "Editar conductor",
      subtitle: (
        name: string,
        employeeNumber: string | null,
        licenseTypeLabel: string,
        licenseNumber: string,
      ) =>
        employeeNumber
          ? `${name} · No. empleado ${employeeNumber} · ${licenseTypeLabel} · ${licenseNumber}`
          : `${name} · ${licenseTypeLabel} · ${licenseNumber}`,
      toast: {
        successTitle: "Conductor actualizado",
        successDescription: "Los cambios se guardaron correctamente.",
        errorTitle: "No se pudo guardar",
      },
      employeeBanner: {
        title: "Empleado vinculado",
        description:
          "Nombre, contacto y datos fiscales se editan en el perfil del empleado, no en este formulario.",
        viewProfile: "Ver perfil del empleado",
      },
    },
    create: {
      title: "Registrar Conductor",
      subtitle:
        "Completa los pasos para registrar un empleado como conductor",
      stepHelper: "Completa los campos obligatorios del paso para continuar.",
      employeeAlert:
        "Para registrar un conductor, el colaborador debe existir primero como empleado.",
      createEmployeeLink: "Registrar empleado",
      toast: {
        successTitle: "Conductor registrado",
        successDescription: "El conductor ha sido registrado exitosamente",
        errorTitle: "Error al registrar conductor",
      },
      wizard: {
        steps: {
          employee: {
            title: "Empleado",
            description: "Vincular un empleado existente",
          },
          licenses: {
            title: "Licencias y salud",
            description: "Federal SICT, estatal opcional y certificado médico",
          },
          exams: {
            title: "Exámenes y equipo",
            description: "Psicométrico, antidoping, GPS y notas",
          },
          review: {
            title: "Revisión",
            description: "Confirmar antes de registrar",
          },
        },
      },
    },
    employeeSelector: {
      label: "Empleado",
      placeholder: "Buscar empleado...",
      searchPlaceholder: "Buscar por nombre o número...",
      loading: "Buscando empleados...",
      loadError: "Error al cargar empleados",
      empty: "No se encontraron empleados disponibles",
      emptyWithPosition: (position: string) =>
        `No hay empleados disponibles con puesto «${position}»`,
      createLink: "Crear nuevo empleado",
      createFooter: "¿No encuentras al empleado? Créalo primero",
      helper:
        "Solo se muestran empleados activos que no están registrados como conductores",
      helperWithPosition: (position: string) =>
        `Solo empleados activos con puesto «${position}», sin registro como conductor`,
      ariaLabel: "Seleccionar empleado",
      groupHeading: "Empleados disponibles",
    },
    section: {
      employee: {
        title: "Empleado",
        description: "Selecciona el colaborador que operará unidades en campo.",
      },
      license: {
        title: "Licencias de conducir",
        description:
          "Captura la licencia federal SICT y, si aplica, la licencia estatal.",
      },
      licenseFederal: {
        title: "Licencia federal (SICT)",
        description:
          "Número, categoría A–F y vencimiento. Es el NumLicencia de Carta Porte. Completa las tres o déjalas vacías.",
      },
      licenseState: {
        title: "Licencia estatal (opcional)",
        description:
          "Complemento para operación local. Completa número, vencimiento y estado emisor, o déjalas vacías.",
      },
      medical: {
        title: "Certificado médico (opcional)",
        description:
          "Examen de aptitud física. Opcional; no bloquea el alta ni el despacho.",
      },
      psychometric: {
        title: "Examen psicométrico (opcional)",
        description: "Evaluación psicológica y de aptitudes al volante.",
      },
      drugTest: {
        title: "Examen antidoping (opcional)",
        description:
          "Última prueba registrada; vigencia estimada de 180 días.",
      },
      device: {
        title: "Dispositivo GPS",
        description: "Identificador del rastreador o telemetría asignado.",
      },
      notes: {
        title: "Notas internas",
        description:
          "Restricciones operativas, observaciones o certificaciones adicionales.",
      },
      review: {
        title: "Revisión",
        description: "Confirma los datos antes de registrar al conductor.",
        groupEmployee: "Empleado",
        groupLicenseMedical: "Licencias y certificado médico",
        groupExamsDevice: "Exámenes, dispositivo y notas",
      },
    },
    label: {
      employeeId: "Empleado",
      federalLicenseNumber: "Número de licencia federal",
      federalLicenseCategory: "Categoría SICT (A–F)",
      federalLicenseExpiry: "Vencimiento federal",
      stateLicenseNumber: "Número de licencia estatal",
      stateLicenseExpiry: "Vencimiento estatal",
      stateIssuingState: "Estado emisor",
      medicalNumber: "Número de certificado",
      medicalExpiry: "Fecha de vencimiento",
      medicalIssuer: "Institución emisora",
      psychometricDate: "Fecha del examen",
      psychometricResult: "Resultado",
      drugTestDate: "Fecha del último examen",
      drugTestResult: "Resultado",
      deviceId: "ID del dispositivo",
      notes: "Notas",
    },
    placeholder: {
      federalLicenseNumber: "Ej. SICT-123456789",
      stateLicenseNumber: "Ej. EST-987654",
      medicalNumber: "Ej. CM-2026-001234",
      medicalIssuer: "Ej. IMSS, hospital autorizado",
      deviceId: "Ej. GPS-001, TLM-A1234",
      notes: "Restricciones, observaciones o certificaciones adicionales…",
      selectType: "Seleccionar categoría",
      selectState: "Seleccionar estado",
      selectResult: "Seleccionar resultado",
      selectNone: "Sin especificar",
    },
    hint: {
      deviceId: "Opcional. Identificador único del GPS o telemetría.",
      reviewEmpty: "Sin registrar",
      reviewOptional: "No especificado",
      groupEmpty: "Sin capturar. Completa el grupo entero o déjalo vacío.",
      groupCompleteOrEmpty:
        "Grupo completo o vacío: no dejes campos sueltos.",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      register: "Registrar conductor",
      clearFederal: "Quitar licencia federal",
      clearState: "Quitar licencia estatal",
    },
    validation: {
      summaryEdit: "Revisa los siguientes campos",
      summaryWizard: "Revisa la información del conductor",
      apiAlertTitle: "No se pudo guardar",
    },
    state: {
      notFoundTitle: "Conductor no encontrado",
      notFoundDescription:
        "El conductor que intentas editar no existe o fue eliminado.",
      backToList: "Volver a conductores",
    },
  },
} as const;

export type DriversCopy = typeof driversCopy;

export function resolveLicenseMedicalAlertTitle(input: {
  federalExpired: boolean;
  federalExpiring: boolean;
  stateExpired: boolean;
  stateExpiring: boolean;
  medicalExpired: boolean;
  medicalExpiring: boolean;
}): string {
  const {
    federalExpired,
    federalExpiring,
    stateExpired,
    stateExpiring,
    medicalExpired,
    medicalExpiring,
  } = input;
  const copy = driversCopy.detail.alert.title;

  const hasLicenseAlert =
    federalExpired ||
    federalExpiring ||
    stateExpired ||
    stateExpiring;
  const hasMedicalAlert = medicalExpired || medicalExpiring;
  const anyLicenseExpired = federalExpired || stateExpired;

  if (hasLicenseAlert && hasMedicalAlert) {
    if (anyLicenseExpired && medicalExpired) return copy.bothExpired;
    if (anyLicenseExpired || medicalExpired) return copy.reviewDocs;
    return copy.bothExpiring;
  }

  if (hasLicenseAlert) {
    if (federalExpired && stateExpired) return copy.licensesExpired;
    if (federalExpired) return copy.federalExpired;
    if (stateExpired) return copy.stateExpired;
    if (federalExpiring && stateExpiring) return copy.licensesExpiring;
    if (federalExpiring) return copy.federalExpiring;
    if (stateExpiring) return copy.stateExpiring;
    return copy.licenseExpiring;
  }

  return medicalExpired ? copy.medicalExpired : copy.medicalExpiring;
}
