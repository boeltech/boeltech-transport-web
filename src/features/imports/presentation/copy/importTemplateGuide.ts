/**
 * Leyenda operativa de plantillas CSV (ADR-0074 / SDD §6.8).
 * Headers técnicos intactos — solo etiquetas humanas para el wizard.
 */

import type { ImportImplementedEntityType } from "../../domain";

export type TemplateColumnRequirement = "required" | "recommended" | "optional";

export type TemplateGuideSectionId = "essentials" | "catalog" | "location";

export interface TemplateColumnGuide {
  /** Nombre exacto de columna en el CSV (contrato). */
  header: string;
  /** Etiqueta operativa. */
  label: string;
  /** Tip corto (1 línea). */
  tip: string;
  requirement: TemplateColumnRequirement;
  /**
   * D4 — cómo escribir valores enumerados:
   * "lo que ves → lo que escribes en la celda".
   */
  writeAs?: string;
  /** Solo direcciones: agrupación visual. */
  section?: TemplateGuideSectionId;
}

export interface ImportTemplateGuide {
  title: string;
  intro: string;
  leaveHeadersNote: string;
  /** D3: direcciones abierta por defecto. */
  defaultOpen: boolean;
  sections?: ReadonlyArray<{
    id: TemplateGuideSectionId;
    title: string;
  }>;
  /** Escenarios operativos (ej. federal-only / state-only). */
  scenarios?: ReadonlyArray<{
    title: string;
    body: string;
  }>;
  columns: ReadonlyArray<TemplateColumnGuide>;
}

const REQUIREMENT_LABELS: Record<TemplateColumnRequirement, string> = {
  required: "Obligatorio",
  recommended: "Recomendado",
  optional: "Opcional",
};

export const importTemplateGuideCopy = {
  requirementLabel: (r: TemplateColumnRequirement) => REQUIREMENT_LABELS[r],
  toggleShow: "Cómo llenar este archivo",
  toggleHide: "Ocultar guía de columnas",
  technicalHint: (header: string) => `Columna: ${header}`,
  scenariosHeading: "Ejemplos de filas",
} as const;

export const IMPORT_TEMPLATE_GUIDES: Record<
  ImportImplementedEntityType,
  ImportTemplateGuide
> = {
  clients: {
    title: "Cómo llenar este archivo",
    intro:
      "Cada fila es un cliente. No renombres ni borres la primera fila (nombres de columna).",
    leaveHeadersNote:
      "Deja los nombres de columna exactamente como vienen en la plantilla.",
    defaultOpen: false,
    columns: [
      {
        header: "tax_id",
        label: "RFC",
        tip: "Identifica al cliente. Si ya existe, se actualizará según tus opciones.",
        requirement: "required",
      },
      {
        header: "legal_name",
        label: "Razón social / nombre",
        tip: "Nombre fiscal completo.",
        requirement: "required",
      },
      {
        header: "tax_regime",
        label: "Régimen fiscal",
        tip: "Código de régimen del contribuyente.",
        requirement: "required",
        writeAs:
          "Persona moral (general) → 601 · Público en general → 616 (otros códigos según el régimen del cliente)",
      },
      {
        header: "type",
        label: "Tipo de cliente",
        tip: "Si lo dejas vacío, se toma como empresa.",
        requirement: "recommended",
        writeAs: "Empresa → company · Persona física → individual",
      },
      {
        header: "payment_terms",
        label: "Forma de cobro",
        tip: "Si lo dejas vacío, se toma como contado.",
        requirement: "recommended",
        writeAs: "Contado → cash · Crédito → credit",
      },
      {
        header: "trade_name",
        label: "Nombre comercial",
        tip: "Cómo conoces al cliente en operación.",
        requirement: "optional",
      },
      {
        header: "contact_name",
        label: "Contacto",
        tip: "Persona de referencia.",
        requirement: "optional",
      },
      {
        header: "phone",
        label: "Teléfono",
        tip: "Solo dígitos, sin espacios.",
        requirement: "optional",
      },
      {
        header: "email",
        label: "Correo",
        tip: "Correo de contacto.",
        requirement: "optional",
      },
      {
        header: "billing_email",
        label: "Correo para facturas",
        tip: "Si es distinto del de contacto.",
        requirement: "optional",
      },
      {
        header: "credit_days",
        label: "Días de crédito",
        tip: "Solo si cobras a crédito.",
        requirement: "optional",
      },
      {
        header: "credit_limit",
        label: "Límite de crédito",
        tip: "Monto máximo; deja vacío si no aplica.",
        requirement: "optional",
      },
      {
        header: "notes",
        label: "Notas",
        tip: "Texto libre para tu equipo.",
        requirement: "optional",
      },
    ],
  },

  addresses: {
    title: "Cómo llenar este archivo",
    intro:
      "Cada fila es un domicilio ligado a un cliente o empleado que ya exista. Empieza por lo imprescindible; los códigos de catálogo van después.",
    leaveHeadersNote:
      "Deja los nombres de columna exactamente como vienen en la plantilla.",
    defaultOpen: true,
    sections: [
      { id: "essentials", title: "Imprescindible" },
      { id: "catalog", title: "Domicilio y catálogo" },
      { id: "location", title: "Ubicación (opcional)" },
    ],
    columns: [
      {
        header: "owner_type",
        label: "¿De quién es el domicilio?",
        tip: "Define si pertenece a un cliente o a un empleado.",
        requirement: "required",
        writeAs: "Cliente → client · Empleado → employee",
        section: "essentials",
      },
      {
        header: "owner_tax_id",
        label: "RFC del cliente dueño",
        tip: "Obligatorio si el dueño es cliente. Debe existir ya en el sistema.",
        requirement: "required",
        section: "essentials",
      },
      {
        header: "owner_employee_number",
        label: "Número de empleado dueño",
        tip: "Obligatorio si el dueño es empleado. Debe existir ya en el sistema.",
        requirement: "required",
        section: "essentials",
      },
      {
        header: "external_code",
        label: "Tu código del domicilio",
        tip: "Identificador propio (único por dueño). Sirve para actualizar después.",
        requirement: "required",
        section: "essentials",
      },
      {
        header: "address_type",
        label: "Tipo de domicilio",
        tip: "Para qué usas esta dirección.",
        requirement: "required",
        writeAs:
          "Fiscal → fiscal · Operativa / bodega → operational (también acepta billing, shipping, warehouse, …)",
        section: "essentials",
      },
      {
        header: "location_name",
        label: "Nombre del lugar",
        tip: "Ej. Bodega norte, Oficina matriz.",
        requirement: "recommended",
        section: "essentials",
      },
      {
        header: "street",
        label: "Calle",
        tip: "Nombre de la calle.",
        requirement: "required",
        section: "catalog",
      },
      {
        header: "exterior_number",
        label: "Número exterior",
        tip: "Número o s/n.",
        requirement: "required",
        section: "catalog",
      },
      {
        header: "interior_number",
        label: "Número interior",
        tip: "Deja vacío si no aplica.",
        requirement: "optional",
        section: "catalog",
      },
      {
        header: "postal_code",
        label: "Código postal",
        tip: "5 dígitos.",
        requirement: "required",
        section: "catalog",
      },
      {
        header: "sat_state_code",
        label: "Estado (código)",
        tip: "Código de entidad federativa del catálogo (ej. JAL).",
        requirement: "required",
        section: "catalog",
      },
      {
        header: "sat_country_code",
        label: "País (código)",
        tip: "Si lo dejas vacío, se usa MEX.",
        requirement: "recommended",
        writeAs: "México → MEX",
        section: "catalog",
      },
      {
        header: "sat_municipality_code",
        label: "Municipio (código)",
        tip: "Código de municipio del catálogo; conviene incluirlo para pasar la revisión.",
        requirement: "recommended",
        section: "catalog",
      },
      {
        header: "sat_neighborhood_code",
        label: "Colonia (código)",
        tip: "Código de colonia del catálogo, si aplica.",
        requirement: "optional",
        section: "catalog",
      },
      {
        header: "sat_locality_code",
        label: "Localidad (código)",
        tip: "Solo si aplica al domicilio.",
        requirement: "optional",
        section: "catalog",
      },
      {
        header: "latitude",
        label: "Latitud",
        tip: "Para mapa; opcional.",
        requirement: "optional",
        section: "location",
      },
      {
        header: "longitude",
        label: "Longitud",
        tip: "Para mapa; opcional.",
        requirement: "optional",
        section: "location",
      },
      {
        header: "notes",
        label: "Notas",
        tip: "Texto libre.",
        requirement: "optional",
        section: "location",
      },
    ],
  },

  employees: {
    title: "Cómo llenar este archivo",
    intro:
      "Cada fila es un empleado. Si vas a cargar conductores después, usa un número de empleado que puedas repetir ahí.",
    leaveHeadersNote:
      "Deja los nombres de columna exactamente como vienen en la plantilla.",
    defaultOpen: false,
    columns: [
      {
        header: "employee_number",
        label: "Número de empleado",
        tip: "Tu clave interna. Si falta, se puede generar alta; sin número no se actualiza después.",
        requirement: "recommended",
      },
      {
        header: "first_name",
        label: "Nombre(s)",
        tip: "Nombre de pila.",
        requirement: "required",
      },
      {
        header: "last_name",
        label: "Primer apellido",
        tip: "Apellido paterno.",
        requirement: "required",
      },
      {
        header: "second_last_name",
        label: "Segundo apellido",
        tip: "Opcional.",
        requirement: "optional",
      },
      {
        header: "curp",
        label: "CURP",
        tip: "Si no hay número de empleado, puede usarse para reconocer al empleado.",
        requirement: "recommended",
      },
      {
        header: "rfc",
        label: "RFC",
        tip: "Opcional en el padrón. Si el empleado irá como figura en Carta Porte, complétalo antes de timbrar.",
        requirement: "optional",
      },
      {
        header: "employment_type",
        label: "Tipo de contrato",
        tip: "Cómo está contratado.",
        requirement: "recommended",
        writeAs: "Planta → permanent (otros valores según tu catálogo interno)",
      },
      {
        header: "hire_date",
        label: "Fecha de ingreso",
        tip: "Solo AAAA-MM-DD. Si Excel muestra 03/11/2019, escribe 2019-11-03 como texto; no uses barras.",
        requirement: "optional",
        writeAs: "3 noviembre 2019 → 2019-11-03",
      },
      {
        header: "email",
        label: "Correo",
        tip: "Correo laboral o personal.",
        requirement: "optional",
      },
      {
        header: "phone",
        label: "Teléfono",
        tip: "Opcional.",
        requirement: "optional",
      },
      {
        header: "mobile_phone",
        label: "Celular",
        tip: "Opcional.",
        requirement: "optional",
      },
      {
        header: "department",
        label: "Área",
        tip: "Ej. Operaciones.",
        requirement: "optional",
      },
      {
        header: "position",
        label: "Puesto",
        tip: "Ej. Conductor.",
        requirement: "optional",
      },
      {
        header: "job_title",
        label: "Título / categoría",
        tip: "Detalle del rol.",
        requirement: "optional",
      },
      {
        header: "base_salary",
        label: "Sueldo base",
        tip: "Número sin símbolos; opcional.",
        requirement: "optional",
      },
      {
        header: "notes",
        label: "Notas",
        tip: "Texto libre.",
        requirement: "optional",
      },
    ],
  },

  vehicles: {
    title: "Cómo llenar este archivo",
    intro:
      "Cada fila es una unidad tractor con los datos de autotransporte del alta. Los remolques no van en este archivo: si la configuración es S/R, se eligen al crear el viaje (Flota → Remolques).",
    leaveHeadersNote:
      "Deja los nombres de columna exactamente como vienen en la plantilla.",
    defaultOpen: false,
    columns: [
      {
        header: "unit_number",
        label: "Número económico",
        tip: "Identifica la unidad. Si ya existe, se actualizará según tus opciones.",
        requirement: "required",
      },
      {
        header: "license_plate",
        label: "Placas",
        tip: "5 a 7 caracteres alfanuméricos (sin espacios ni guiones). Únicas entre unidades.",
        requirement: "required",
      },
      {
        header: "brand",
        label: "Marca",
        tip: "Ej. Kenworth.",
        requirement: "recommended",
      },
      {
        header: "model",
        label: "Modelo",
        tip: "Ej. T680.",
        requirement: "recommended",
      },
      {
        header: "year",
        label: "Año",
        tip: "Año modelo.",
        requirement: "required",
      },
      {
        header: "type",
        label: "Tipo de unidad",
        tip: "Clasificación interna.",
        requirement: "recommended",
        writeAs: "Camión → truck (otros según tu catálogo)",
      },
      {
        header: "vin",
        label: "VIN / serie",
        tip: "Si lo tienes.",
        requirement: "optional",
      },
      {
        header: "color",
        label: "Color",
        tip: "Opcional.",
        requirement: "optional",
      },
      {
        header: "load_capacity",
        label: "Capacidad de carga",
        tip: "Número (ej. kg).",
        requirement: "optional",
      },
      {
        header: "insurance_company",
        label: "Aseguradora RC",
        tip: "AseguraRespCivil — requerida para Carta Porte.",
        requirement: "required",
      },
      {
        header: "insurance_policy",
        label: "Póliza de seguro RC",
        tip: "PolizaRespCivil — requerida para Carta Porte.",
        requirement: "required",
      },
      {
        header: "insurance_expiry",
        label: "Vence seguro",
        tip: "Solo AAAA-MM-DD. Si Excel muestra 03/11/2019, escribe 2019-11-03 como texto; no uses barras.",
        requirement: "optional",
        writeAs: "3 noviembre 2019 → 2019-11-03",
      },
      {
        header: "sct_permit_number",
        label: "Permiso SCT",
        tip: "NumPermisoSCT — requerido para Carta Porte.",
        requirement: "required",
      },
      {
        header: "sct_permit_expiry",
        label: "Vence permiso SCT",
        tip: "Solo AAAA-MM-DD. Si Excel muestra 03/11/2019, escribe 2019-11-03 como texto; no uses barras.",
        requirement: "optional",
        writeAs: "3 noviembre 2019 → 2019-11-03",
      },
      {
        header: "sat_tipo_permiso_code",
        label: "Tipo de permiso (código)",
        tip: "PermSCT — catálogo c_TipoPermiso.",
        requirement: "required",
        writeAs: "Ejemplo frecuente → TPAF01",
      },
      {
        header: "sat_config_autotransporte_code",
        label: "Configuración vehicular",
        tip: "ConfigVehicular — catálogo c_ConfigAutotransporte. Si el código es S/R, el remolque se elige en el viaje, no en este CSV.",
        requirement: "required",
        writeAs: "Ej. C2, T3S2",
      },
      {
        header: "peso_bruto_vehicular",
        label: "Peso bruto (ton)",
        tip: "PesoBrutoVehicular en toneladas (> 0).",
        requirement: "required",
      },
      {
        header: "branch_id",
        label: "Sucursal",
        tip: "Identificador interno de sucursal; deja vacío si no aplica.",
        requirement: "optional",
      },
      {
        header: "notes",
        label: "Notas",
        tip: "Texto libre.",
        requirement: "optional",
      },
    ],
  },

  drivers: {
    title: "Cómo llenar este archivo",
    intro:
      "Cada fila es un conductor ligado a un empleado que ya exista (mismo número de empleado). El RFC va en el empleado, no en este archivo. Puedes capturar licencia federal SICT, estatal, o ambas; al menos un grupo completo es obligatorio. Un grupo a medias (p. ej. solo número federal sin categoría) falla la validación. Para Carta Porte se usa el número federal.",
    leaveHeadersNote:
      "Deja los nombres de columna exactamente como vienen en la plantilla.",
    defaultOpen: false,
    scenarios: [
      {
        title: "Solo federal",
        body: "Llena federal_license_number + federal_license_category + federal_license_expiry. Deja vacías las tres columnas state_*.",
      },
      {
        title: "Solo estatal",
        body: "Llena state_license_number + state_license_expiry + state_issuing_state. Deja vacías las tres federal_*. Sirve para flota local; Carta Porte pedirá federal después.",
      },
      {
        title: "Ambas",
        body: "Completa el grupo federal y el grupo estatal (seis columnas con valor). No mezcles medias: o el grupo completo o vacío.",
      },
    ],
    columns: [
      {
        header: "employee_number",
        label: "Número de empleado",
        tip: "Debe coincidir con un empleado ya cargado.",
        requirement: "required",
      },
      {
        header: "federal_license_number",
        label: "Número de licencia federal (SICT)",
        tip: "Licencia Federal de Conductor. Es el NumLicencia de Carta Porte cuando aplica. Completa el grupo federal junto con categoría y vencimiento, o déjalo vacío si solo capturas estatal.",
        requirement: "recommended",
      },
      {
        header: "federal_license_category",
        label: "Categoría SICT (A–F)",
        tip: "Categorías oficiales DOF 2016: A pasajeros/turismo, B carga general, C rabón/tortón, D chofer-guía, E especializada/peligrosos/doble articulado, F pasajeros puerto/aeropuerto. No es catálogo estatal.",
        requirement: "recommended",
      },
      {
        header: "federal_license_expiry",
        label: "Vence licencia federal",
        tip: "Solo AAAA-MM-DD. Si Excel muestra 03/11/2019, escribe 2019-11-03 como texto; no uses barras.",
        requirement: "recommended",
        writeAs: "3 noviembre 2019 → 2019-11-03",
      },
      {
        header: "state_license_number",
        label: "Número de licencia estatal",
        tip: "Opcional. Completa número + vencimiento + estado emisor juntos, o deja las tres vacías.",
        requirement: "optional",
      },
      {
        header: "state_license_expiry",
        label: "Vence licencia estatal",
        tip: "Solo AAAA-MM-DD. Obligatorio si capturas número estatal.",
        requirement: "optional",
        writeAs: "3 noviembre 2019 → 2019-11-03",
      },
      {
        header: "state_issuing_state",
        label: "Estado emisor (licencia estatal)",
        tip: "Ej. Jalisco, GTO, CDMX. Obligatorio si capturas número estatal.",
        requirement: "optional",
      },
      {
        header: "medical_certificate_number",
        label: "Certificado médico",
        tip: "Número, si aplica. Opcional; no bloquea despacho.",
        requirement: "optional",
      },
      {
        header: "medical_certificate_expiry",
        label: "Vence certificado médico",
        tip: "Solo AAAA-MM-DD. Si Excel muestra 03/11/2019, escribe 2019-11-03 como texto; no uses barras.",
        requirement: "optional",
        writeAs: "3 noviembre 2019 → 2019-11-03",
      },
      {
        header: "notes",
        label: "Notas",
        tip: "Texto libre.",
        requirement: "optional",
      },
    ],
  },
};
