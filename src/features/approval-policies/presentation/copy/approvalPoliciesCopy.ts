/**
 * Copy es-MX de Reglas de autorización (ADR-0099 · SDD §4.4).
 */
import {
  ADVANCE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from "@features/settlements/domain/enums";
import type { ApprovalConcept, PolicyTemplateId } from "../../domain";

export const APPROVAL_CONCEPT_LABELS: Record<ApprovalConcept, string> = {
  driver_advance: "Anticipos",
  trip_expense: "Gastos de viaje",
  settlement: "Liquidaciones",
  disbursement: "Dispersión",
};

export const APPROVAL_CONCEPT_DESCRIPTIONS: Record<ApprovalConcept, string> = {
  driver_advance: "Solicitudes de anticipo a operadores antes de entregarse.",
  trip_expense: "Gastos capturados en el viaje antes de contarse en costos.",
  settlement: "Cortes de liquidación a operadores antes de pagarse.",
  disbursement: "Quién puede ejecutar el pago de anticipos y liquidaciones autorizados.",
};

/** Categorías que la condición «categoría» admite por concepto. */
export const CONCEPT_CATEGORY_LABELS: Partial<Record<ApprovalConcept, Record<string, string>>> = {
  driver_advance: ADVANCE_CATEGORY_LABELS,
  trip_expense: EXPENSE_CATEGORY_LABELS,
};

export function categoryLabelFor(concept: ApprovalConcept): (category: string) => string {
  const labels = CONCEPT_CATEGORY_LABELS[concept] ?? {};
  return (category) => labels[category] ?? category;
}

/** Prefijo «Paso n: » solo cuando el paso es un entero ≥ 1. */
function withStepPrefix(stepNo: number | null | undefined, body: string): string {
  if (typeof stepNo === "number" && stepNo >= 1) return `Paso ${stepNo}: ${body}`;
  return body;
}

export const TEMPLATE_LABELS: Record<PolicyTemplateId, { title: string; description: string }> = {
  oneApprover: {
    title: "Un autorizador",
    description: "Cualquier autorizador activo firma, sin importar el monto.",
  },
  byAmount: {
    title: "Por monto",
    description: "Montos menores los firma el equipo; los altos, un administrador.",
  },
  doubleSign: {
    title: "Doble firma",
    description: "Montos altos requieren dos firmas de personas distintas.",
  },
};

export const approvalPoliciesCopy = {
  page: {
    sectionTitle: "Reglas de autorización",
    title: "Reglas de autorización",
    description:
      "Define quién autoriza anticipos, gastos de viaje, liquidaciones y dispersión según el monto y la situación.",
    loadError: "No pudimos cargar las reglas de autorización.",
    retry: "Reintentar",
    readOnlyViewer: "Solo un administrador puede cambiar estas reglas. Puedes consultarlas y probarlas.",
    editDisabled:
      "La edición de reglas está desactivada temporalmente para tu empresa. Puedes consultarlas y probarlas.",
  },
  floorNote: {
    title: "Regla que siempre aplica",
    text: "Nadie autoriza lo que envió, salvo un administrador que sea el único autorizador activo",
  },
  card: {
    standardBadge: "Estándar",
    customBadge: "Personalizada",
    standardText: "Usando la regla estándar: cualquier autorizador activo",
    standardTextWithThreshold: (amount: string) =>
      `Usando la regla estándar: cualquier autorizador activo, desde ${amount}`,
    settlementThreshold: (amount: string) => `Piden autorización los pagos desde ${amount}.`,
    settlementThresholdZero: "Todos los pagos piden autorización.",
    settlementThresholdNone: "Ningún pago pide autorización por monto; solo las correcciones manuales.",
    meta: (version: number, effectiveFrom: string, createdByName?: string | null) =>
      [`v${version}`, `Vigente desde ${effectiveFrom}`, createdByName].filter(Boolean).join(" · "),
    pending: (n: number) =>
      n === 1 ? "1 solicitud pendiente con la regla vigente" : `${n} solicitudes pendientes con la regla vigente`,
    view: "Ver regla",
    customize: "Personalizar",
    edit: "Editar",
    history: "Historial",
    manualAdjustmentsNote: "Las correcciones manuales siempre piden autorización.",
  },
  sheet: {
    titleEdit: (concept: string) => `Regla de ${concept.toLowerCase()}`,
    titleView: (concept: string) => `Regla de ${concept.toLowerCase()}`,
    descriptionEdit:
      "Los tramos se evalúan por monto; si una solicitud cumple la condición de un tramo, aplica el de monto más alto.",
    descriptionView: "Así se decide hoy quién autoriza este concepto.",
    templatesTitle: "Empezar desde una plantilla",
    templatesHint: "Reemplaza el borrador; puedes ajustarlo antes de guardar.",
    applyTemplate: "Usar",
    tierTitle: (n: number) => `Tramo ${n}`,
    baseTier: "Tramo base · aplica a cualquier monto",
    minAmount: "Desde (monto en MXN)",
    thresholdAmountHint: "Monto mínimo para pedir autorización.",
    addNoApprovalTier: "No pedir autorización en montos bajos",
    removeTier: "Quitar tramo",
    addTier: "Agregar tramo",
    maxTiers: "Máximo 4 tramos por regla.",
    conditionsTitle: "Aplica solo si se cumple cualquiera de:",
    conditionsHint: "Sin condiciones, el tramo aplica por monto.",
    categoriesLabel: "Categorías",
    categoriesPlaceholder: "Cualquier categoría",
    missingCfdi: "Gasto sin CFDI",
    manualAdjustments: "Liquidación con ajustes manuales",
    noApproval: "Este tramo no requiere autorización",
    noApprovalHint:
      "Los pagos por debajo del siguiente tramo no piden autorización. Las correcciones manuales siempre la piden.",
    stepTitle: (n: number) => `Paso ${n}`,
    singleStepTitle: "Quién autoriza",
    rolesLabel: "Roles que pueden firmar",
    peopleLabel: "Personas designadas",
    peoplePlaceholder: "Ninguna",
    peopleSearch: "Buscar persona…",
    peopleEmpty: "Sin coincidencias",
    eligibleCount: (n: number) =>
      n === 1 ? "1 persona puede aprobar" : `${n} personas pueden aprobar`,
    singleEligibleWarning: "Solo una persona puede firmar este paso; si se ausenta, nadie podrá autorizar.",
    addStep: "Agregar segunda firma",
    removeStep: "Quitar segunda firma",
    disbursementSingleStep: "La dispersión la ejecuta una sola persona.",
    summaryLabel: "Resumen",
    cancel: "Cancelar",
    close: "Cerrar",
    save: "Guardar regla",
    saving: "Guardando…",
    reset: "Restablecer estándar",
    resetting: "Restableciendo…",
    validationTitle: "Revisa la regla antes de guardar",
    conflictTitle: "La regla cambió mientras la editabas",
    reload: "Recargar regla vigente",
    editDisabledTitle: "Edición desactivada",
  },
  confirm: {
    title: "¿Guardar la nueva regla?",
    description: (n: number) =>
      n === 1
        ? "Aplica a solicitudes nuevas. La 1 pendiente sigue con la regla anterior"
        : `Aplica a solicitudes nuevas. Las ${n} pendientes siguen con la regla anterior`,
    descriptionNoPending: "Aplica a solicitudes nuevas.",
    confirm: "Guardar",
    cancel: "Seguir editando",
    resetTitle: "¿Restablecer la regla estándar?",
    resetDescription: "Cualquier autorizador activo podrá firmar las solicitudes nuevas de este concepto.",
    resetDescriptionSettlement: (amount: string) =>
      `Cualquier autorizador activo firmará los pagos nuevos desde ${amount}.`,
    resetDescriptionSettlementZero: "Cualquier autorizador activo firmará todos los pagos nuevos.",
    resetConfirm: "Restablecer",
  },
  toasts: {
    saved: "Regla de autorización guardada",
    reset: "Regla de autorización restablecida al estándar",
    singleEligibleWarning: (n: number) =>
      n === 1
        ? "Un paso tiene una sola persona que puede firmar."
        : `${n} pasos tienen una sola persona que puede firmar.`,
    saveError: "No se pudo guardar la regla",
  },
  validation: {
    noEligible: (reason: string) => `Nadie activo puede aprobar este paso: ${reason}`,
    noEligibleReason: "ningún usuario activo tiene esos roles o está designado",
    doubleSign: (n: number) => `La doble firma necesita dos personas distintas; hoy hay ${n}`,
    stepEmpty: "Elige al menos un rol o una persona",
    baseTier: "El primer tramo debe empezar en $0 y no tener condiciones",
    amountOrder: "El monto debe ser mayor que el del tramo anterior",
    amountRequired: "Captura un monto mayor a $0",
    duplicateAmount: "Ya hay otro tramo sin condiciones con este monto",
    roleOutsideCeiling: "Ese rol no puede autorizar este concepto",
    unknownUser: "Una persona designada ya no está activa",
    approvalRequired: "Este concepto siempre requiere autorización",
    generic: "Revisa este paso",
  },
  simulator: {
    title: "Probar la regla",
    hintDraft: "Prueba el borrador con un caso: no se guarda nada.",
    hintCurrent: "Prueba la regla vigente con un caso.",
    amount: "Monto (MXN)",
    category: "Categoría",
    anyCategory: "Sin categoría",
    missingCfdi: "Sin CFDI",
    manualAdjustments: "Con ajustes manuales",
    run: "Probar",
    running: "Probando…",
    noApproval: "No requiere autorización.",
    tierApplied: (n: number) => `Aplica el tramo ${n}.`,
    stepLine: (n: number, total: number) => (total > 1 ? `Paso ${n}` : "Pueden autorizar"),
    nobody: "Nadie activo puede firmar",
    violationsTitle: "Esta regla no se podría guardar así:",
    violationNoEligible: (stepNo?: number | null) =>
      withStepPrefix(
        stepNo,
        "nadie activo puede firmar (ningún usuario activo tiene esos roles o está designado).",
      ),
    violationDoubleSign: (stepNo?: number | null) =>
      withStepPrefix(
        stepNo,
        "la doble firma necesita dos personas distintas; solo hay una elegible.",
      ),
    violationGeneric: (stepNo?: number | null) => withStepPrefix(stepNo, "revisa este paso."),
    error: "No se pudo probar la regla",
  },
  versions: {
    title: (concept: string) => `Historial · ${concept}`,
    description: "Cada guardado crea una versión; las solicitudes conservan la versión con la que nacieron.",
    empty: "Aún no hay versiones personalizadas; se usa la regla estándar.",
    loadError: "No se pudo cargar el historial.",
    version: (n: number) => `v${n}`,
    by: (name: string) => `por ${name}`,
    resetSource: "Restablecida al estándar",
    noChanges: "Sin cambios respecto a la versión anterior",
    prev: "Anteriores",
    next: "Más recientes",
    tier: (n: number) => `Tramo ${n}`,
    step: (n: number) => `paso ${n}`,
    tiersCount: (from: unknown, to: unknown) => `Número de tramos: ${String(from)} → ${String(to)}`,
    approvalOn: "requiere autorización",
    approvalOff: "sin autorización",
    conditions: "condiciones cambiadas",
    added: "agregado",
    removed: "quitado",
  },
  orphan: {
    title: "Este cambio deja reglas sin firmante",
    description:
      "Si continúas, estos pasos se quedarán sin nadie activo que pueda firmarlos y las solicitudes nuevas se detendrán ahí hasta que ajustes la regla.",
    line: (concept: string, tier: number, step: number) => `${concept} · Tramo ${tier} · Paso ${step}`,
    reasonNoEligible: "nadie podría firmar",
    reasonDoubleSign: "la doble firma quedaría con una sola persona",
    confirm: "Continuar de todos modos",
    cancel: "Cancelar",
  },
} as const;
