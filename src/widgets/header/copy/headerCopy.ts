import { BRAND } from "@shared/ui/brand";

export const headerCopy = {
  commandMenu: {
    title: "Búsqueda rápida",
    trigger: "Buscar o ir a página…",
    placeholder: "Busca un viaje por folio, una factura o una página…",
    empty: "Sin coincidencias.",
    searching: "Buscando…",
    groups: {
      trips: "Viajes",
      invoices: "Facturas",
    },
    noClient: "Sin cliente",
  },
  menu: {
    account: "Mi cuenta",
    settings: "Configuración",
    help: "Ayuda",
    logout: "Cerrar Sesión",
    noCompany: "Sin empresa",
    userFallback: "Usuario",
  },
  help: {
    title: "Ayuda",
    description:
      "Escríbenos si tienes dudas sobre el uso de la plataforma. Te respondemos por correo.",
    contactSupport: "Contactar soporte",
    docs: "Guías y documentación",
    close: "Cerrar",
    contextTenant: "Empresa",
    contextUser: "Usuario",
    contextPage: "Página",
    contextEnv: "Entorno",
    contextVersion: "Versión",
    contextMissing: "—",
    mailtoSubject: (productName: string, tenantName: string) =>
      tenantName
        ? `Ayuda ${productName} — ${tenantName}`
        : `Ayuda ${productName}`,
    mailtoBody: (input: {
      productName: string;
      tenantName: string;
      userEmail: string;
      currentPath: string;
      environment: string;
      release: string;
    }) =>
      [
        `Hola,`,
        ``,
        `Necesito ayuda con ${input.productName}.`,
        ``,
        `Empresa: ${input.tenantName}`,
        `Usuario: ${input.userEmail}`,
        `Página: ${input.currentPath}`,
        `Entorno: ${input.environment}`,
        `Versión: ${input.release}`,
        ``,
        `---`,
        `Describe tu consulta debajo:`,
        ``,
      ].join("\n"),
    productFallback: BRAND.productName,
  },
} as const;
