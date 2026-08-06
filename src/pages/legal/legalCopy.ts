/**
 * Copy de páginas legales públicas.
 * Namespace: legal.copy.*
 * Textos base para registro y footer; no sustituyen asesoría jurídica formal.
 */
import { BRAND } from "@shared/ui/brand";

export const legalCopy = {
  brand: BRAND.productName,
  backHome: "Volver al inicio",
  contact: "soporte@boeltech.com",
  updatedAt: "26 de julio de 2026",

  terms: {
    title: "Términos de servicio",
    description: `Condiciones de uso del servicio ${BRAND.productName} para empresas de transporte.`,
    sections: [
      {
        heading: "1. Aceptación",
        body: `Al crear una cuenta, iniciar sesión o usar ${BRAND.productName} (el «Servicio»), aceptas estos términos. Si no estás de acuerdo, no uses el Servicio.`,
      },
      {
        heading: "2. Descripción del servicio",
        body: `${BRAND.productName} es una plataforma multi-tenant para gestionar operación de transporte y facturación fiscal en México (incluidos CFDI, Carta Porte y complementos de pago según el plan y módulos contratados). Algunas capacidades se ofrecen como add-ons o packs aparte del plan Operación. ${BRAND.productName} es un producto de ${BRAND.companyName}.`,
      },
      {
        heading: "3. Cuentas y acceso",
        body: "Eres responsable de la confidencialidad de credenciales, del uso de tu identificador de empresa (subdominio) y de las acciones de los usuarios de tu organización. Debes proporcionar información veraz al registrarte y mantener actualizados los datos fiscales y de contacto.",
      },
      {
        heading: "4. Prueba y suscripción",
        body: "Podemos ofrecer un periodo de prueba (por ejemplo, 14 días con cupo limitado de timbres) sin tarjeta, sujeto a las condiciones comerciales vigentes. Al terminar la prueba o agotar el cupo, el acceso operativo o el timbrado pueden restringirse hasta activar o renovar un plan. Los precios, límites de capacidad y módulos se describen en el catálogo comercial y en la pantalla Tu plan de tu cuenta.",
      },
      {
        heading: "5. Uso aceptable",
        body: "No debes usar el Servicio para actividades ilícitas, abusar de la infraestructura, intentar acceder a datos de otros tenants, ni eludir controles de seguridad, cuotas o entitlements. Nos reservamos el derecho de suspender cuentas ante incumplimiento o riesgo de seguridad.",
      },
      {
        heading: "6. Datos y responsabilidad fiscal",
        body: `Tú eres el responsable fiscal de los CFDI y complementos emitidos con tus CSD y datos. ${BRAND.companyName} provee herramientas tecnológicas; no sustituye asesoría contable, legal o fiscal. Debes validar la información antes de timbrar.`,
      },
      {
        heading: "7. Disponibilidad y cambios",
        body: "Procuramos mantener el Servicio disponible, pero no garantizamos disponibilidad ininterrumpida. Podemos modificar funciones, planes o estos términos con aviso razonable cuando el cambio sea material.",
      },
      {
        heading: "8. Contacto",
        body: "Para dudas sobre estos términos: soporte@boeltech.com.",
      },
    ],
  },

  privacy: {
    title: "Política de privacidad",
    description: `Cómo tratamos datos personales y de uso en ${BRAND.productName}.`,
    sections: [
      {
        heading: "1. Responsable",
        body: `${BRAND.companyName} opera ${BRAND.productName}. Para ejercer derechos ARCO o consultas de privacidad: soporte@boeltech.com.`,
      },
      {
        heading: "2. Datos que tratamos",
        body: "Datos de cuenta (nombre, correo, rol), datos de la empresa (nombre comercial, identificador/subdominio, datos fiscales que captures), datos operativos que ingreses (viajes, clientes, flota, facturación) y datos técnicos de sesión (dirección IP, identificadores de dispositivo/navegador, registros de acceso) necesarios para prestar y asegurar el Servicio.",
      },
      {
        heading: "3. Finalidades",
        body: "Prestar el Servicio, autenticar usuarios, facturar el uso comercial cuando aplique, cumplir obligaciones legales, prevenir fraude y mejorar la estabilidad del producto. No vendemos datos personales.",
      },
      {
        heading: "4. Encargados y terceros",
        body: "Podemos usar proveedores de infraestructura, correo, observabilidad o PAC de facturación bajo contratos de encargo. El timbrado fiscal implica intercambio con el PAC y, en su caso, con el SAT según la normativa aplicable.",
      },
      {
        heading: "5. Conservación",
        body: "Conservamos los datos mientras la cuenta esté activa y el tiempo adicional que exijan obligaciones fiscales, contables o de seguridad. Puedes solicitar eliminación de cuenta sujeto a retenciones legales.",
      },
      {
        heading: "6. Seguridad",
        body: "Aplicamos medidas técnicas y organizativas razonables (control de acceso, cifrado en tránsito, aislamiento multi-tenant). Ningún sistema es 100 % seguro; notifica incidentes sospechosos a soporte.",
      },
      {
        heading: "7. Derechos",
        body: "Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos personales conforme a la legislación mexicana aplicable, escribiendo a soporte@boeltech.com.",
      },
      {
        heading: "8. Cambios",
        body: "Podemos actualizar esta política. La fecha de actualización aparece en esta página. El uso continuado tras cambios materiales implica conocimiento de la versión vigente.",
      },
    ],
  },
} as const;
