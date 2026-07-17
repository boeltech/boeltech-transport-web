export const platformCopy = {
  brand: {
    name: "Boeltech Platform",
    subtitle: "Administración SaaS del ERP-T",
  },
  shell: {
    headerContext: "Consola tenant 0",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    collapseSidebar: "Colapsar",
    readOnlyHint: "solo lectura",
    guestRole: "Operador",
  },
  login: {
    title: "Acceso de plataforma",
    description:
      "Inicia sesión con tu cuenta de operador Boeltech. Este acceso es distinto al login de empresas cliente.",
    emailLabel: "Correo",
    passwordLabel: "Contraseña",
    submit: "Entrar a plataforma",
    submitting: "Iniciando sesión…",
    tenantLink: "¿Eres usuario de una empresa?",
    tenantLinkAction: "Ir al login operativo",
    errors: {
      invalidCredentials: "Credenciales inválidas. Verifica tu correo y contraseña.",
      sessionExpired: "Tu sesión de plataforma expiró. Inicia sesión de nuevo.",
    },
  },
  nav: {
    dashboard: "Panel",
    tenants: "Empresas",
    catalogs: "Catálogos globales",
    audit: "Auditoría",
    logout: "Cerrar sesión",
    erpLink: "Ir al ERP tenant",
  },
  dashboard: {
    title: "Panel de plataforma",
    description: "Vista agregada del parque de clientes ERP-T.",
    hero: {
      badge: "Consola SaaS",
      secondaryBadge: "Tenant 0",
      title: "Supervisa empresas, planes y crecimiento",
      description:
        "Punto de entrada para operadores Boeltech: revisa cuántas empresas están activas, cómo se distribuyen por plan y qué tan saludable es la base instalada antes de entrar al detalle de cada tenant.",
      stepPrefix: (step: number) => `Paso ${step}`,
      steps: [
        {
          title: "Lee los indicadores",
          description: "Empresas activas, suspendidas y usuarios totales.",
        },
        {
          title: "Revisa planes",
          description: "Distribución comercial del parque de clientes.",
        },
        {
          title: "Profundiza por tenant",
          description: "Desde Empresas: plan, timbres, módulos y auditoría.",
        },
      ],
    },
    cards: {
      totalTenants: "Empresas registradas",
      totalTenantsHint: "Tenants provisionados en plataforma",
      activeTenants: "Empresas activas",
      activeTenantsHint: "Operando sin suspensión",
      suspendedTenants: "Empresas suspendidas",
      suspendedTenantsHint: "Requieren revisión o reactivación",
      totalUsers: "Usuarios activos",
      totalUsersHint: "Suma en todos los tenants",
      newTenants: "Altas últimos 30 días",
      newTenantsHint: "Nuevas empresas en el mes",
    },
    plans: {
      title: "Distribución por plan comercial",
      description:
        "Cuántas empresas tiene asignado cada plan. Los códigos se muestran con su nombre comercial cuando está disponible.",
      columns: {
        plan: "Plan",
        tenants: "Empresas",
        share: "Participación",
      },
      tenantCount: (count: number) =>
        count === 1 ? "1 empresa" : `${count} empresas`,
      empty: {
        title: "Sin empresas con plan",
        description: "Aún no hay tenants con plan comercial asignado.",
      },
    },
    quickLinks: {
      title: "Accesos rápidos",
      description: "Tareas frecuentes desde la consola de plataforma.",
      tenants: {
        label: "Empresas cliente",
        description: "Lista, alta, detalle y ciclo de vida.",
      },
      audit: {
        label: "Auditoría",
        description: "Acciones de operadores sobre tenants.",
      },
      catalogs: {
        label: "Catálogos globales",
        description: "Catálogos compartidos del ecosistema.",
      },
    },
    error: {
      title: "No se pudieron cargar las métricas",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar la página.",
    },
  },
  tenants: {
    list: {
      title: "Empresas cliente",
      description: "Gestiona el ciclo de vida, planes y uso operativo de cada tenant.",
      entityLabelPlural: "empresas",
      hero: {
        badge: "Cartera de clientes",
        title: "Encuentra y administra empresas del ecosistema",
        description:
          "Busca por nombre o identificador, filtra por estado y plan, y entra al detalle para revisar suscripción, timbres, módulos y auditoría.",
        stepPrefix: (step: number) => `Paso ${step}`,
        steps: [
          {
            title: "Busca o filtra",
            description: "Ubica la empresa por nombre, estado o plan.",
          },
          {
            title: "Abre el detalle",
            description: "Consulta plan, consumo y módulos contratados.",
          },
          {
            title: "Gestiona el ciclo de vida",
            description: "Asigna plan, suspende o revisa auditoría.",
          },
        ],
      },
      metrics: {
        registered: "Empresas registradas",
        registeredHint: "Total en plataforma",
        active: "Empresas activas",
        activeHint: "Operando sin suspensión",
        suspended: "Suspendidas",
        suspendedHint: "Requieren seguimiento",
      },
      table: {
        title: "Listado de empresas",
        description: "Haz clic en una fila para abrir el detalle del tenant.",
      },
      searchPlaceholder: "Buscar por nombre o identificador…",
      create: "Nueva empresa",
      readOnlyHint:
        "Tu rol es de soporte: puedes consultar empresas, pero no crear ni cambiar su ciclo de vida.",
      readOnlyTitle: "Modo solo lectura",
      filters: {
        status: "Estado",
        plan: "Plan",
        allStatuses: "Todos los estados",
        allPlans: "Todos los planes",
        statusChip: (label: string) => `Estado: ${label}`,
        planChip: (label: string) => `Plan: ${label}`,
      },
      columns: {
        name: "Empresa",
        subdomain: "Identificador",
        plan: "Plan",
        usage: "Uso",
        status: "Estado",
        created: "Alta",
      },
      usageSummary: (users: number, branches: number) =>
        `${users} usuarios · ${branches} sucursales`,
      empty: {
        title: "Sin empresas",
        description: "Crea la primera empresa cliente desde plataforma.",
        searchTitle: "Sin coincidencias",
        searchDescription:
          "No hay empresas que coincidan con la búsqueda o filtros actuales.",
      },
      refreshSuccess: "Lista actualizada",
    },
    detail: {
      title: "Detalle de empresa",
      back: "Volver a empresas",
      notFound: {
        title: "Empresa no encontrada",
        description: "El tenant no existe o fue eliminado.",
      },
      sections: {
        overview: "Resumen operativo",
        usage: "Uso operativo",
        operation: "Operación del tenant",
        plan: "Plan comercial",
        subscription: "Suscripción comercial",
        stampUsage: "Consumo de timbres",
      },
      hero: {
        badge: "Cliente ERP",
        description:
          "Consulta el plan comercial, los módulos contratados y el consumo de timbres fiscales de esta empresa. Usa las acciones del encabezado para gestionar suscripción, módulos o ciclo de vida.",
        planFallback: "Plan comercial",
        stepPrefix: (step: number) => `Paso ${step}`,
        steps: [
          {
            title: "Suscripción y límites",
            description: "Plan, precio, periodo y capacidad incluida.",
          },
          {
            title: "Consumo de timbres",
            description: "Uso fiscal del periodo y excedentes estimados.",
          },
          {
            title: "Módulos y facturación",
            description: "Add-ons activos y total mensual estimado.",
          },
        ],
      },
      metrics: {
        monthlyPrice: "Precio mensual",
        monthlyPriceHint: "Precio de lista del plan",
        stampsUsed: "Timbres usados",
        stampsHint: (period: string) => `Periodo ${period}`,
        estimatedTotal: "Total estimado",
        estimatedTotalHint: "Con IVA · periodo actual",
        activeModules: "Módulos contratados",
        activeModulesHint: "Add-ons y packs activos",
      },
      usage: {
        users: "Usuarios activos",
        branches: "Sucursales activas",
        trips: "Viajes registrados",
      },
      subscription: {
        loading: "Cargando suscripción…",
        unavailable: "Sin suscripción comercial registrada.",
        description:
          "Condiciones comerciales y límites operativos asignados al tenant.",
        levelBadge: (level: string) => `Nivel ${level}`,
        profitabilityHint:
          "Nivel de analítica de rentabilidad habilitado para este tenant.",
        trialQuotaHint:
          "En prueba: cupo efectivo 15 timbres. Al pasar a Activa se restaura el paquete del plan.",
        trialExhaustedTitle: "Cupo de prueba agotado",
        trialExhaustedDescription:
          "El tenant usó los 15 timbres de prueba. El timbrado está bloqueado hasta reactivar el plan.",
        trialExpiredTitle: "Periodo de prueba vencido",
        trialExpiredDescription:
          "La fecha de fin de prueba ya pasó. El timbrado está bloqueado hasta reactivar el plan.",
        unlimited: "Ilimitado",
        historyMonths: (months: number) =>
          months === 1 ? "1 mes" : `${months} meses`,
        fields: {
          plan: "Plan comercial",
          status: "Estado",
          cycle: "Ciclo de facturación",
          price: "Precio de lista",
          period: "Periodo actual",
          profitabilityLevel: "Nivel de rentabilidad",
          users: "Usuarios incluidos",
          branches: "Sucursales incluidas",
          historyRetention: "Retención de historial",
          trial: "Fin de prueba",
          notes: "Notas internas",
        },
        statusLabels: {
          trialing: "En prueba",
          active: "Activa",
          past_due: "Vencida",
          paused: "Pausada",
          canceled: "Cancelada",
        },
        cycleLabels: {
          monthly: "Mensual",
          annual: "Anual",
        },
      },
      stampUsage: {
        loading: "Cargando consumo…",
        unavailable: "Consumo de timbres no disponible.",
        description:
          "Timbres consumidos al timbrar CFDI (facturas, Carta Porte, REP, etc.) en el periodo de facturación.",
        summary: (used: number, included: number) =>
          `${used} de ${included} timbres`,
        remaining: (count: number) =>
          count === 1 ? "1 timbre disponible" : `${count} timbres disponibles`,
        prepaidRemaining: (count: number) =>
          count === 1
            ? "1 timbre prepago disponible"
            : `${count} timbres prepago disponibles`,
        usedPercent: (percent: number) => `${percent}% del paquete usado`,
        period: "Periodo",
        quotaPolicy: "Política de excedente",
        quotaPolicyLabels: {
          soft_cap: "Tope flexible",
          hard_cap: "Tope estricto",
        } as Record<string, string>,
        quotaPolicyDescriptions: {
          soft_cap:
            "Puede superar el paquete incluido; el excedente se factura por timbre adicional.",
          hard_cap:
            "Al agotar el paquete, el timbrado se detiene hasta el siguiente periodo.",
        } as Record<string, string>,
        overageTitle: "Excedente del periodo",
        overage: (stamps: number, amount: string) =>
          `${stamps} timbre${stamps === 1 ? "" : "s"} fuera del paquete (${amount} estimado)`,
        usageAlerts: {
          watch: {
            title: "Consumo en seguimiento (70%)",
            description: (remaining: number) =>
              remaining <= 0
                ? "El tenant alcanzó el umbral de seguimiento del paquete incluido."
                : `≥70% del paquete. Quedan ${remaining} timbre${remaining === 1 ? "" : "s"} en el periodo.`,
          },
          warning: {
            title: "Paquete casi agotado (80%)",
            description: (remaining: number) =>
              remaining <= 0
                ? "El tenant agotó el paquete incluido. Revisa la política de excedente o contacta a facturación."
                : `Quedan ${remaining} timbre${remaining === 1 ? "" : "s"} del paquete incluido.`,
          },
          exhausted: {
            title: "Paquete agotado (100%)",
            description:
              "El tenant consumió el 100% de los timbres incluidos. Con tope flexible puede seguir timbrando; el excedente se factura por timbre adicional.",
          },
        },
        exportCsv: "Exportar conciliación",
        exportSuccess: "Conciliación descargada",
        exportError: "No se pudo exportar la conciliación",
      },
      actions: {
        manageSubscription: "Gestionar suscripción",
        manageEntitlements: "Módulos contratados",
        grantStampPack: "Acreditar prepago",
        suspend: "Suspender",
        reactivate: "Reactivar",
        cancel: "Cancelar cuenta",
      },
      suspendedAt: (date: string) => `Suspendida el ${date}`,
    },
    stampPacks: {
      title: "Acreditar prepago de timbres",
      description:
        "Asigna un pack del catálogo (50 / 150 / 500). Sin caducidad; se consume antes del overage. No aplica en trial.",
      balanceTitle: "Saldo prepago actual",
      balanceSummary: (remaining: number) =>
        remaining === 1
          ? "1 timbre prepago disponible"
          : `${remaining} timbres prepago disponibles`,
      fields: {
        pack: "Pack prepago",
        notes: "Notas (opcional)",
      },
      placeholders: {
        pack: "Selecciona un pack",
        notes: "Ej. transferencia SPEI, folio comercial…",
      },
      selectedHint: (stamps: number, price: string) =>
        `Se acreditarán ${stamps} timbres (${price}).`,
      submit: "Acreditar pack",
      submitting: "Acreditando…",
      success: "Prepago acreditado",
      error: "No se pudo acreditar el prepago",
      remainingLabel: "Prepago disponible",
      remaining: (count: number) =>
        count === 1 ? "1 timbre" : `${count} timbres`,
    },
    create: {
      title: "Nueva empresa cliente",
      description: "Alta de tenant con administrador inicial y plan comercial.",
      back: "Volver a empresas",
      hero: {
        badge: "Provisionamiento",
        title: "Crea una empresa cliente en tres bloques",
        description:
          "Registra la empresa, define quién administrará el entorno por primera vez y asigna el plan comercial. Al guardar, podrás revisar plan, timbres y módulos en el detalle.",
        stepPrefix: (step: number) => `${step}`,
        steps: [
          {
            title: "Empresa",
            description: "Nombre comercial e identificador único.",
          },
          {
            title: "Administrador inicial",
            description: "Primera cuenta con acceso al ERP de la empresa.",
          },
          {
            title: "Plan comercial",
            description: "Límites, timbres incluidos y precio de lista.",
          },
        ],
      },
      sections: {
        company: "Empresa",
        companyDescription:
          "Datos que identifican a la empresa en la consola y en el ERP.",
        admin: "Administrador inicial",
        adminDescription:
          "Usuario con rol administrador que recibirá acceso al entorno recién creado.",
        plan: "Plan comercial",
        planDescription:
          "Define capacidad operativa y paquete de timbres desde el primer día. La flota es orientativa: puedes elegir otro tier.",
      },
      fields: {
        companyName: "Nombre comercial",
        subdomain: "Identificador (subdominio)",
        adminEmail: "Correo del administrador",
        adminPassword: "Contraseña inicial",
        adminFirstName: "Nombre",
        adminLastName: "Apellido",
        fleetBand: "¿Cuántas unidades opera la empresa?",
        fleetBandPlaceholder: "Opcional — tip de plan",
        fleetBandNone: "Sin declarar (default Esencial)",
        plan: "Plan comercial",
        planPlaceholder: "Selecciona un plan",
        recommendedBadge: "Recomendado",
      },
      fleetBands: {
        "1_10": "1–10 unidades",
        "11_30": "11–30 unidades",
        "31_100": "31–100 unidades",
        "100_plus": "Más de 100 unidades",
      } as Record<string, string>,
      hints: {
        subdomain:
          "Solo minúsculas, números y guiones (sin guión al inicio o final). Mínimo 3 caracteres.",
        subdomainPreview: (value: string) =>
          value
            ? `Identificador: ${value}`
            : "El identificador aparecerá aquí al escribirlo.",
        adminPassword:
          "Entre 8 y 128 caracteres, con mayúscula, minúscula y número. Puedes generar una segura y copiarla para entregarla al administrador.",
        adminEmail:
          "Será el usuario con el que el administrador inicia sesión en el ERP.",
        fleetBand:
          "Rangos orientativos del catálogo comercial. No bloquean un plan distinto.",
        planOverride:
          "Puedes elegir otro plan distinto al sugerido según flota.",
      },
      passwordActions: {
        show: "Mostrar contraseña",
        hide: "Ocultar contraseña",
        generate: "Generar segura",
        copy: "Copiar contraseña",
        copied: "Contraseña copiada",
        copyError: "No se pudo copiar la contraseña",
      },
      plansLoading: "Cargando planes comerciales…",
      plansEmpty: "No hay planes comerciales disponibles. Intenta de nuevo más tarde.",
      planPreview: {
        title: "Resumen del plan seleccionado",
        price: "Precio de lista",
        users: "Usuarios incluidos",
        branches: "Sucursales incluidas",
        stamps: "Timbres incluidos",
        unlimited: "Ilimitado",
        stampsPerMonth: (count: number) => `${count} timbres/mes`,
      },
      notice: {
        title: "Qué ocurre al crear",
        description:
          "Se provisiona la empresa, se asigna el plan seleccionado y se redirige al detalle. El administrador podrá entrar al ERP con el correo y contraseña indicados.",
      },
      validation: {
        companyNameRequired: "El nombre comercial es requerido",
        companyNameMax: "Máximo 255 caracteres",
        subdomainMin: "Mínimo 3 caracteres",
        subdomainMax: "Máximo 50 caracteres",
        subdomainFormat:
          "Solo minúsculas, números y guiones; sin guión al inicio o final",
        adminEmailInvalid: "Correo inválido",
        adminPasswordMin: "La contraseña debe tener al menos 8 caracteres",
        adminPasswordMax: "Máximo 128 caracteres",
        adminPasswordComplexity:
          "Debe contener mayúscula, minúscula y número",
        adminFirstNameRequired: "Nombre requerido",
        adminFirstNameMax: "Máximo 100 caracteres",
        adminLastNameRequired: "Apellido requerido",
        adminLastNameMax: "Máximo 100 caracteres",
        planRequired: "Selecciona un plan",
        summaryTitle: "Revisa los datos de la empresa",
      },
      cancel: "Cancelar",
      submit: "Crear empresa",
      submitting: "Creando empresa…",
      success: "Empresa creada correctamente",
      error: "No se pudo crear la empresa",
      accessDenied: "No tienes permiso para crear empresas.",
    },
    manageSubscription: {
      title: "Gestionar suscripción",
      description:
        "Único lugar para cambiar el plan comercial, ciclo, estado y notas internas de la suscripción.",
      fleetHint: (bandLabel: string, planName: string) =>
        `Según flota declarada (${bandLabel}) → sugerido ${planName}. Puedes elegir otro plan.`,
      trialHint:
        "En prueba: cupo de 15 timbres en el periodo y 14 días por defecto si no defines fin de prueba. Al pasar a Activa se restaura el paquete del plan.",
      fields: {
        plan: "Plan comercial",
        status: "Estado",
        cycle: "Ciclo",
        trial: "Fin de prueba (opcional)",
        notes: "Notas internas",
      },
      placeholders: {
        plan: "Selecciona un plan",
        notes: "Ej. acuerdo comercial, descuento temporal…",
      },
      submit: "Guardar suscripción",
      submitting: "Guardando…",
      success: "Suscripción actualizada",
      error: "No se pudo actualizar la suscripción",
    },
    entitlements: {
      title: "Módulos contratados",
      description:
        "Activa o revoca add-ons y packs. Los packs expanden sus módulos incluidos automáticamente.",
      loading: "Cargando catálogo…",
      empty: "No hay módulos en el catálogo comercial.",
      packBadge: "Pack",
      includesMembers: (count: number) =>
        count === 1 ? "Incluye 1 módulo" : `Incluye ${count} módulos`,
      levelBadge: (level: string) => `Nivel ${level}`,
      effectiveCount: (count: number) =>
        count === 1 ? "1 módulo efectivo" : `${count} módulos efectivos`,
      success: "Entitlements actualizados",
      error: "No se pudo actualizar el módulo",
      readOnlyHint: "Tu rol es de soporte: solo lectura de entitlements.",
      previewPrice: (amount: string, tier: "ea" | "ga") =>
        tier === "ea"
          ? `Precio al activar: ${amount} (Early Access)`
          : `Precio al activar: ${amount}`,
      lockedPrice: (amount: string) => `Precio bloqueado: ${amount}/mes`,
    },
    commercial: {
      title: "Módulos y facturación estimada",
      description:
        "Add-ons y packs contratados con desglose de precios de lista y total mensual estimado.",
      loading: "Cargando desglose comercial…",
      unavailable: "Desglose comercial no disponible.",
      manageCta: "Gestionar módulos",
      noModules: {
        title: "Sin add-ons adicionales",
        description:
          "El plan base incluye los módulos operativos. Los add-ons contratados aparecerán aquí.",
      },
      totalsSection: "Desglose mensual estimado",
      eaBadge: "Early Access",
      perMonth: "/mes",
      kindLabels: {
        addon: "Add-on",
        pack: "Pack",
        minipack: "Mini-pack",
      } as Record<string, string>,
      totals: {
        plan: "Plan Operación",
        modules: "Add-ons y packs",
        overage: "Excedente de timbres (periodo)",
        subtotal: "Subtotal estimado",
        iva: "IVA (16%)",
        estimatedTotal: "Total estimado (con IVA)",
      },
      disclaimer:
        "Precios de lista mensuales sin IVA en líneas; el total incluye IVA. El cobro y CFDI los gestiona Boeltech fuera del producto (v1 manual).",
    },
    suspend: {
      suspendTitle: "Suspender empresa",
      reactivateTitle: "Reactivar empresa",
      cancelTitle: "Cancelar empresa",
      suspendDescription:
        "Los usuarios del tenant no podrán iniciar sesión hasta reactivar la cuenta.",
      reactivateDescription:
        "Restaura el acceso operativo para todos los usuarios activos del tenant.",
      cancelDescription:
        "Marca la cuenta como cancelada. Usa esta acción solo para bajas definitivas.",
      reasonLabel: "Motivo (opcional)",
      reasonPlaceholder: "Ej. impago, solicitud del cliente…",
      confirmSuspend: "Suspender",
      confirmReactivate: "Reactivar",
      confirmCancel: "Confirmar cancelación",
      success: "Estado actualizado",
      error: "No se pudo actualizar el estado",
    },
  },
  catalogs: {
    title: "Catálogos globales",
    description:
      "Importación centralizada de catálogos regulatorios SAT para todo el ecosistema ERP-T.",
    entityLabelPlural: "catálogos",
    hero: {
      badge: "Catálogos regulatorios",
      secondaryBadge: "Ámbito global",
      title: "Actualiza catálogos SAT para todos los tenants",
      description:
        "Desde aquí cargas versiones oficiales en CSV. Los cambios aplican a nivel plataforma y alimentan validaciones fiscales y operativas de las empresas cliente.",
      stepPrefix: (step: number) => `Paso ${step}`,
      steps: [
        {
          title: "Elige el catálogo",
          description: "Ubica el tipo SAT que vas a actualizar.",
        },
        {
          title: "Importa el CSV",
          description: "Sube el archivo oficial y valida la estructura.",
        },
        {
          title: "Confirma la versión",
          description: "La importación queda registrada en auditoría.",
        },
      ],
    },
    metrics: {
      satCatalogs: "Catálogos SAT",
      satCatalogsHint: "Disponibles para importación global",
      visibleResults: "Resultados visibles",
      visibleResultsHint: "Según tu búsqueda actual",
      importAccess: "Permiso de importación",
      importEnabled: "Habilitado",
      importDisabled: "Solo lectura",
      importEnabledHint: "Rol platform owner",
      importDisabledHint: "Rol platform support",
    },
    search: {
      placeholder: "Buscar por nombre o código SAT…",
    },
    table: {
      title: "Catálogos SAT disponibles",
      description:
        "Selecciona un catálogo para abrir el asistente de importación CSV.",
      columns: {
        catalog: "Catálogo",
        source: "Fuente",
        action: "Acción",
      },
    },
    import: "Importar CSV",
    readOnlyHint:
      "Tu rol es de soporte: puedes consultar catálogos, pero no importar CSV.",
    readOnlyTitle: "Modo solo lectura",
    csvTypeMismatchHint:
      "El CSV no coincide con el catálogo seleccionado. Verifica el archivo SAT correcto.",
    empty: {
      title: "Sin catálogos SAT",
      description: "No hay tipos de catálogo disponibles para importación global.",
      searchTitle: "Sin coincidencias",
      searchDescription: "Prueba con otro nombre o código de catálogo SAT.",
    },
    error: {
      title: "No se pudieron cargar los catálogos",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar la página.",
    },
  },
  audit: {
    title: "Auditoría de plataforma",
    description:
      "Historial de acciones cross-tenant realizadas por operadores Boeltech.",
    entityLabelPlural: "eventos",
    hero: {
      badge: "Trazabilidad",
      title: "Revisa qué hicieron los operadores en la plataforma",
      description:
        "Cada alta de empresa, cambio de plan, importación de catálogo o ajuste de módulos queda registrado con operador, fecha y tenant afectado.",
      stepPrefix: (step: number) => `Paso ${step}`,
      steps: [
        {
          title: "Filtra el historial",
          description: "Por acción, empresa o rango de fechas.",
        },
        {
          title: "Identifica el operador",
          description: "Correo del usuario de plataforma que ejecutó el cambio.",
        },
        {
          title: "Profundiza en el tenant",
          description: "Abre la empresa para ver su contexto comercial.",
        },
      ],
    },
    metrics: {
      totalEvents: "Eventos registrados",
      totalEventsHint: "Según filtros aplicados",
      pageResults: "En esta página",
      pageResultsHint: "Eventos visibles ahora",
      activeFilters: "Filtros activos",
      activeFiltersHint: "Criterios aplicados al historial",
    },
    filtersCard: {
      title: "Filtros de auditoría",
      description:
        "Combina acción, fechas y empresa para acotar el historial. Usa «Aplicar fechas» después de elegir el rango.",
    },
    tenantFilter: {
      title: "Filtrando por empresa",
      description: (tenantName: string) =>
        `Mostrando solo eventos de ${tenantName}.`,
      clear: "Ver todos los eventos",
    },
    refreshSuccess: "Auditoría actualizada",
    filters: {
      action: "Acción",
      allActions: "Todas las acciones",
      dateFrom: "Desde",
      dateTo: "Hasta",
      applyDates: "Aplicar fechas",
      tenantChip: (label: string) => `Empresa: ${label}`,
      actionChip: (label: string) => `Acción: ${label}`,
      dateFromChip: (label: string) => `Desde: ${label}`,
      dateToChip: (label: string) => `Hasta: ${label}`,
    },
    columns: {
      date: "Fecha",
      operator: "Operador",
      action: "Acción",
      tenant: "Empresa",
      details: "Detalle",
    },
    actions: {
      tenant_created: "Empresa creada",
      tenant_status_changed: "Estado de empresa",
      tenant_plan_assigned: "Plan asignado",
      catalog_import: "Importación catálogo",
      subscription_assigned: "Suscripción asignada",
      module_entitled: "Módulo activado",
      module_revoked: "Módulo revocado",
    },
    viewTenantAudit: "Ver auditoría",
    empty: {
      title: "Sin eventos",
      description: "No hay registros de auditoría con los filtros actuales.",
      searchTitle: "Sin coincidencias",
      searchDescription:
        "Prueba ampliando el rango de fechas o quitando filtros.",
    },
    error: {
      title: "No se pudo cargar la auditoría",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar.",
    },
    metadata: {
      statusChanged: (previousStatus: string, status: string, reason?: string | null) =>
        reason
          ? `${previousStatus} → ${status} · ${reason}`
          : `${previousStatus} → ${status}`,
      planAssigned: (planCode: string) => `Plan: ${planCode}`,
      tenantCreated: (subdomain: string, planCode?: string | null) =>
        planCode ? `${subdomain} · ${planCode}` : subdomain,
      catalogImport: (typeCode?: string | null, version?: string | null) =>
        typeCode
          ? version
            ? `${typeCode} v${version}`
            : typeCode
          : "Importación global",
      subscriptionAssigned: (planCode: string, status?: string | null) =>
        status ? `Plan: ${planCode} · ${status}` : `Plan: ${planCode}`,
      moduleEntitled: (moduleCode: string) => `Módulo: ${moduleCode}`,
      moduleRevoked: (moduleCode: string) => `Módulo: ${moduleCode}`,
    },
  },
  roles: {
    platform_owner: "Propietario plataforma",
    platform_support: "Soporte plataforma",
  },
} as const;
