/**
 * Namespace: employees.copy.detail.*
 * Copy del detalle de empleado (header, KPIs, tabs, alertas).
 */
export const employeesCopy = {
  detail: {
    title: {
      fallback: "Empleado",
    },
    state: {
      notFoundTitle: "Empleado no encontrado",
      notFoundDescription:
        "El empleado que buscas no existe o fue eliminado del catálogo.",
      backToList: "Volver a empleados",
      terminatedRegistration: "Registro dado de baja",
    },
    stat: {
      tenure: {
        title: "Antigüedad",
        descriptionUntilTermination: "Hasta fecha de baja",
      },
      baseSalary: {
        title: "Salario base",
        description: "Importe base registrado en nómina",
      },
      contractType: {
        title: "Tipo de contrato",
        description: "Relación laboral declarada",
      },
      imss: {
        title: "Estatus IMSS",
        withNss: "Con registro NSS",
        withoutNss: "Sin NSS",
        descriptionWithNss: "Declarado en nómina",
        descriptionWithoutNss: "Sin número de seguridad social",
      },
    },
    tab: {
      personal: "Personal",
      contact: "Contacto",
      employment: "Laboral",
      compensation: "Compensación",
    },
    alert: {
      nssMissing: {
        title: "NSS sin registrar",
        body: "No hay número de seguridad social capturado. Es obligatorio para nómina e IMSS.",
      },
      terminationPlanned: {
        title: "Baja programada próxima",
        body: (days: number) =>
          `La fecha de baja registrada es en ${days} día${days === 1 ? "" : "s"}. Verifica fechas y documentación.`,
      },
      eventualContract: {
        title: "Contrato eventual",
        body: "Controla vigencia y renovaciones según política interna y registro ante IMSS.",
      },
      driverRole: {
        linkConductores: "Conductores",
        linkViajes: "Viajes",
        footerPrefix: "Ver ficha en",
        footerOrTrips: "o revisar",
        pendingTitle: "Conductor con operación pendiente",
        activeTitle: "Registrado como conductor activo",
        statusLine: (statusLabel: string) =>
          `Estado operativo del conductor: ${statusLabel}.`,
        activeTripsLine: (
          count: number,
          codesSuffix: string,
        ) =>
          `Tiene ${count} viaje${count === 1 ? "" : "s"} activo${count === 1 ? "" : "s"} como conductor${codesSuffix}.`,
        blockOnTrip:
          "No podrá darse de baja como empleado hasta finalizar o cancelar el viaje en curso, o actualizar el estado en Conductores.",
        blockActiveTrips:
          "No podrá darse de baja como empleado hasta completar o cancelar esos viajes.",
        autoDeactivate:
          "Al dar de baja al empleado, el rol de conductor se desactivará automáticamente si no hay viajes activos ni está en viaje.",
      },
    },
    section: {
      personal: {
        title: "Información personal",
        description:
          "Datos demográficos y de identidad registrados en el expediente.",
      },
      fiscal: {
        title: "Datos fiscales y gobierno",
        description:
          "Identificadores oficiales para nómina, IMSS y obligaciones laborales.",
      },
      medicalNotes: {
        title: "Notas médicas",
        description: "Observaciones de salud relevantes para operación o nómina.",
      },
      contact: {
        title: "Datos de contacto",
        description: "Correo y teléfonos para comunicación operativa.",
      },
      address: {
        title: "Domicilio",
        description:
          "Domicilio personal con códigos SAT cuando el expediente los incluye.",
      },
      emergency: {
        title: "Contacto de emergencia",
        description: "Persona a contactar en incidentes o urgencias.",
      },
      employment: {
        title: "Información laboral",
        description:
          "Contrato, puesto, ubicación y fechas de ingreso o baja en la empresa.",
      },
      notes: {
        title: "Notas internas",
        description: "Observaciones del expediente no visibles en otros módulos.",
      },
      compensation: {
        title: "Compensación",
        description: "Salario base, frecuencia y método de pago declarados.",
      },
      banking: {
        title: "Datos bancarios",
        description: "Cuenta y CLABE para dispersión de nómina.",
      },
    },
    label: {
      fullName: "Nombre completo",
      birthDate: "Fecha de nacimiento",
      gender: "Género",
      maritalStatus: "Estado civil",
      nationality: "Nacionalidad",
      birthPlace: "Lugar de nacimiento",
      bloodType: "Tipo de sangre",
      curp: "CURP",
      rfc: "RFC",
      nss: "NSS",
      infonavit: "Infonavit",
      email: "Correo electrónico",
      phone: "Teléfono",
      mobilePhone: "Celular",
      street: "Calle",
      neighborhood: "Colonia",
      cityState: "Ciudad / estado",
      postalCode: "C.P.",
      country: "País",
      satLocality: "Localidad SAT",
      reference: "Referencia",
      latitude: "Latitud",
      longitude: "Longitud",
      emergencyName: "Nombre",
      emergencyPhone: "Teléfono",
      emergencyRelationship: "Parentesco",
      employmentType: "Tipo de contrato",
      department: "Departamento",
      position: "Puesto",
      jobTitle: "Título del trabajo",
      workLocation: "Sucursal",
      hireDate: "Fecha de ingreso",
      terminationDate: "Fecha de baja",
      terminationReason: "Motivo de baja",
      baseSalary: "Salario base",
      salaryType: "Frecuencia de pago",
      paymentMethod: "Método de pago",
      bankName: "Banco",
      bankAccount: "No. de cuenta",
      bankClabe: "CLABE",
      employeeNumber: "Número de empleado",
    },
    hint: {
      empty: "Sin registrar",
      emptyOptional: "No especificado",
      countryMexico: "México",
    },
    format: {
      headerLine: (
        employeeNumber: string,
        position: string | null,
        department: string | null,
      ) => {
        const parts = [employeeNumber];
        if (position?.trim()) parts.push(position.trim());
        if (department?.trim()) parts.push(department.trim());
        return parts.join(" · ");
      },
      activeTripCodesSuffix: (
        codes: string[],
        maxVisible = 5,
      ): string => {
        if (codes.length === 0) return "";
        const visible = codes.slice(0, maxVisible).join(", ");
        const ellipsis = codes.length > maxVisible ? ", …" : "";
        return ` (${visible}${ellipsis})`;
      },
      localityWithCode: (name: string, code: string | null | undefined) =>
        code ? `${name} (${code})` : name,
    },
  },
  form: {
    edit: {
      title: "Editar empleado",
      subtitle: (
        fullName: string,
        employeeNumber: string,
        position: string | null,
        department: string | null,
      ) => {
        const parts = [fullName, employeeNumber];
        if (position?.trim()) parts.push(position.trim());
        if (department?.trim()) parts.push(department.trim());
        return parts.join(" · ");
      },
      toast: {
        successTitle: "Empleado actualizado",
        successDescription: "Los cambios se guardaron correctamente.",
        errorTitle: "No se pudo guardar",
        addressPartialTitle: "Empleado actualizado, pero falló el domicilio",
        addressPartialDescription:
          "Se guardaron los datos del empleado, pero no se pudo guardar el domicilio. Reintenta desde edición.",
      },
      identityBanner: {
        title: "Número de empleado fijo",
        description:
          "El identificador interno no se puede cambiar después del alta. Actualiza datos personales, contacto y nómina en las secciones siguientes.",
        viewDetail: "Ver detalle del empleado",
      },
    },
    create: {
      submit: "Registrar empleado",
      toast: {
        successTitle: "Empleado registrado",
        addressPartialTitle: "Empleado creado, pero falló el domicilio",
        addressPartialDescription:
          "El empleado se creó correctamente, pero no se pudo guardar el domicilio. Completa el domicilio desde edición.",
        errorRegister: "Error al registrar",
      },
      wizardAriaLabel: "Pasos para registrar un empleado",
    },
    sidebar: {
      title: "Secciones",
      errorsTitle: (count: number, label: string) =>
        `${count} error${count === 1 ? "" : "es"} en ${label}`,
      errorsAria: (count: number) => `${count} errores`,
    },
    section: {
      personal: {
        nav: "Personal",
        title: "Datos personales",
        description: "Nombre, datos demográficos y tipo de sangre.",
      },
      fiscal: {
        title: "Datos fiscales y gobierno",
        description: "CURP, RFC, NSS e Infonavit para nómina e IMSS.",
      },
      contact: {
        nav: "Contacto",
        title: "Datos de contacto",
        description: "Correo y teléfonos para comunicación operativa.",
      },
      address: {
        title: "Domicilio personal (opcional)",
        infoMessage:
          "Uso interno de RRHH. No se usa en viajes ni en Carta Porte. Puedes dejarlo en blanco.",
      },
      emergency: {
        title: "Contacto de emergencia",
        description: "Persona a contactar en incidentes o urgencias.",
      },
      employment: {
        nav: "Laboral",
        title: "Información laboral",
        description: "Contrato, puesto, ubicación y fecha de ingreso.",
      },
      notes: {
        title: "Notas internas",
        description: "Observaciones generales y notas médicas del expediente.",
      },
      compensation: {
        nav: "Compensación",
        title: "Salario y pago",
        description: "Salario base, frecuencia y método de pago.",
      },
      banking: {
        title: "Datos bancarios",
        description: "Cuenta y CLABE para dispersión de nómina.",
      },
      review: {
        title: "Revisión",
        description: "Confirma los datos antes de registrar al empleado.",
      },
    },
    label: {
      firstName: "Nombre(s)",
      lastName: "Apellido paterno",
      secondLastName: "Apellido materno",
      birthDate: "Fecha de nacimiento",
      gender: "Género",
      maritalStatus: "Estado civil",
      bloodType: "Tipo de sangre",
      nationality: "Nacionalidad",
      birthPlace: "Lugar de nacimiento",
      curp: "CURP",
      rfc: "RFC",
      nss: "NSS (IMSS)",
      infonavit: "No. Infonavit",
      email: "Correo electrónico",
      phone: "Teléfono",
      mobilePhone: "Celular",
      emergencyName: "Nombre completo",
      emergencyPhone: "Teléfono",
      emergencyRelationship: "Parentesco",
      hireDate: "Fecha de ingreso",
      employmentType: "Tipo de contrato",
      department: "Departamento",
      position: "Puesto",
      jobTitle: "Título del trabajo",
      workLocation: "Sucursal",
      notes: "Notas generales",
      medicalNotes: "Notas médicas",
      baseSalary: "Salario base",
      salaryType: "Frecuencia de pago",
      paymentMethod: "Método de pago",
      bankName: "Banco",
      bankAccount: "Número de cuenta",
      bankClabe: "CLABE interbancaria",
      reviewName: "Nombre",
      reviewHire: "Ingreso / tipo",
      reviewEmail: "Correo",
      reviewAddress: "Domicilio",
    },
    placeholder: {
      firstName: "Juan",
      lastName: "García",
      secondLastName: "López",
      nationality: "Mexicana",
      birthPlace: "Ciudad, estado",
      curp: "GARC850101HDFRZN01",
      rfc: "GARJ850101AB1",
      nss: "12345678901",
      email: "correo@ejemplo.com",
      phone: "55 1234 5678",
      mobilePhone: "55 1234 5678",
      emergencyName: "María García",
      jobTitle: "Operador de transporte",
      notes: "Observaciones o notas adicionales…",
      medicalNotes: "Alergias, condiciones especiales…",
      bankName: "BBVA",
      bankAccount: "012345678901234",
      bankClabe: "012345678901234567",
      select: "Seleccionar",
    },
    hint: {
      legacyOption: (value: string) => `${value} (guardada)`,
      legacyWorkLocation: (value: string) =>
        `Ubicación anterior registrada: ${value}`,
      noBranches:
        "No hay sucursales registradas. Crea al menos una para asignar empleados.",
      reviewEmpty: "—",
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar cambios",
      saving: "Guardando…",
      createBranch: "Crear sucursal",
    },
    validation: {
      summaryEdit: "Revisa los siguientes campos",
      summaryCreate: "Revisa los datos del empleado",
    },
    state: {
      notFoundTitle: "Empleado no encontrado",
      notFoundDescription:
        "El empleado que intentas editar no existe o fue eliminado.",
      backToList: "Volver a empleados",
    },
  },
} as const;

export type EmployeesCopy = typeof employeesCopy;
