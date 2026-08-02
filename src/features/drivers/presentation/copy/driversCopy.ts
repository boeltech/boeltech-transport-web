/**
 * Namespace: drivers.copy.detail.*
 * Copy del detalle de conductor (header, capacidades, tabs, alertas).
 */
export const driversCopy = {
  detail: {
    title: {
      fallback: "Conductor",
    },
    state: {
      notFoundTitle: "Conductor no encontrado",
      notFoundDescription:
        "El conductor que buscas no existe o fue eliminado de flota.",
      backToList: "Volver a conductores",
      noEmployeeNumber: "Sin número de empleado",
    },
    stat: {
      totalTrips: {
        title: "Viajes",
        description: "Asignaciones registradas",
      },
      completedTrips: {
        title: "Completados",
        successRate: (pct: number) => `${pct}% de tasa de cierre`,
      },
      experience: {
        title: "Experiencia",
        description: "Años declarados al alta",
        value: (years: number) =>
          years === 1 ? "1 año" : `${years} años`,
      },
    },
    tab: {
      driver: "Conductor",
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
      medicalLabel: "Certificado médico",
      licenseExpiredText: (daysAgo: number, date: string) =>
        `Vencida hace ${daysAgo} días (${date})`,
      licenseExpiringText: (days: number, date: string) =>
        `Vence en ${days} días (${date})`,
      medicalExpiredText: (daysAgo: number, date: string) =>
        `Vencido hace ${daysAgo} días (${date})`,
      medicalExpiringText: (days: number, date: string) =>
        `Vence en ${days} días (${date})`,
      title: {
        bothExpired: "Licencia y certificado médico vencidos",
        bothExpiring: "Licencia y certificado médico próximos a vencer",
        reviewDocs: "Revisar documentación del conductor",
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
        title: "Licencia de conducir",
        description:
          "Vigencia y emisor. El tipo y número aparecen en el encabezado.",
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
    action: {
      loadMoreTrips: "Cargar más",
      loadingMoreTrips: "Cargando…",
    },
    format: {
      employeeLine: (employeeNumber: string) => `No. empleado ${employeeNumber}`,
      licenseLine: (typeLabel: string, licenseNumber: string) =>
        `${typeLabel} · ${licenseNumber}`,
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
      employeeAlert:
        "Para registrar un conductor, el colaborador debe existir primero como empleado.",
      createEmployeeLink: "Registrar empleado",
    },
    section: {
      employee: {
        title: "Empleado",
        description: "Selecciona el colaborador que operará unidades en campo.",
      },
      license: {
        title: "Licencia de conducir",
        description:
          "Licencia federal o estatal requerida para asignación de viajes.",
      },
      medical: {
        title: "Certificado médico",
        description: "Examen de aptitud física para operación de unidades.",
      },
      psychometric: {
        title: "Examen psicométrico",
        description: "Evaluación psicológica y de aptitudes al volante.",
      },
      drugTest: {
        title: "Examen antidoping",
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
        groupLicenseMedical: "Licencia y certificado médico",
        groupExamsDevice: "Exámenes, dispositivo y notas",
      },
    },
    label: {
      employeeId: "ID de empleado vinculado",
      licenseNumber: "Número de licencia",
      licenseType: "Tipo de licencia",
      licenseExpiry: "Fecha de vencimiento",
      licenseState: "Estado emisor",
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
      licenseNumber: "Ej. ABC123456",
      medicalNumber: "Ej. CM-2026-001234",
      medicalIssuer: "Ej. IMSS, hospital autorizado",
      deviceId: "Ej. GPS-001, TLM-A1234",
      notes: "Restricciones, observaciones o certificaciones adicionales…",
      selectType: "Seleccionar tipo",
      selectState: "Seleccionar estado",
      selectResult: "Seleccionar resultado",
    },
    hint: {
      deviceId: "Opcional. Identificador único del GPS o telemetría.",
      reviewEmpty: "Sin registrar",
      reviewOptional: "No especificado",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      register: "Registrar conductor",
    },
    validation: {
      summaryEdit: "Revisa los siguientes campos",
      summaryWizard: "Revisa la información del conductor",
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
  hasLicenseItem: boolean;
  hasMedicalItem: boolean;
  isLicenseExpired: boolean;
  isMedicalExpired: boolean;
}): string {
  const { hasLicenseItem, hasMedicalItem, isLicenseExpired, isMedicalExpired } =
    input;
  const copy = driversCopy.detail.alert.title;

  if (hasLicenseItem && hasMedicalItem) {
    if (isLicenseExpired && isMedicalExpired) return copy.bothExpired;
    if (isLicenseExpired || isMedicalExpired) return copy.reviewDocs;
    return copy.bothExpiring;
  }
  if (hasLicenseItem) {
    return isLicenseExpired ? copy.licenseExpired : copy.licenseExpiring;
  }
  return isMedicalExpired ? copy.medicalExpired : copy.medicalExpiring;
}
