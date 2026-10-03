/**
 * Zod espejo de forma de una regla (SDD §3.1) para el editor. Solo valida lo
 * que el usuario puede corregir en pantalla; la satisfacibilidad la decide el API.
 */
import { z } from "zod";
import type { UserRole } from "@shared/constants/roles";
import {
  APPROVAL_MAX_TIERS,
  APPROVAL_RULES_SCHEMA_VERSION,
  CONDITIONS_BY_CONCEPT,
  conceptAllowsNoApprovalTier,
  conceptMaxSteps,
  getConceptCeilingRoles,
  type ApprovalConcept,
  type ApprovalRules,
} from "../../domain";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";

const v = approvalPoliciesCopy.validation;

const stepSchema = z.object({
  eligibleRoles: z.array(z.string()),
  eligibleUserIds: z.array(z.string()).max(20),
});

const tierSchema = z.object({
  minAmount: z.number({ error: v.amountRequired }).min(0),
  requiresApproval: z.boolean(),
  categories: z.array(z.string()).max(20),
  missingCfdi: z.boolean(),
  manualAdjustments: z.boolean(),
  steps: z.array(stepSchema),
});

export type PolicyFormStep = { eligibleRoles: UserRole[]; eligibleUserIds: string[] };
export type PolicyFormTier = Omit<z.infer<typeof tierSchema>, "steps"> & { steps: PolicyFormStep[] };
export type PolicyFormValues = { tiers: PolicyFormTier[] };

function hasConditions(tier: PolicyFormTier): boolean {
  return tier.categories.length > 0 || tier.missingCfdi || tier.manualAdjustments;
}

export function buildApprovalPolicySchema(concept: ApprovalConcept) {
  const ceiling = getConceptCeilingRoles(concept);
  const allowedConditions = CONDITIONS_BY_CONCEPT[concept];
  const maxSteps = conceptMaxSteps(concept);

  return z
    .object({ tiers: z.array(tierSchema).min(1).max(APPROVAL_MAX_TIERS) })
    .superRefine((values, ctx) => {
      const tiers = values.tiers as PolicyFormTier[];
      const seenUnconditioned = new Set<number>();
      tiers.forEach((tier, i) => {
        const at = (...path: Array<string | number>) => ["tiers", i, ...path];
        if (i === 0) {
          if (tier.minAmount !== 0 || hasConditions(tier)) {
            ctx.addIssue({ code: "custom", path: at("minAmount"), message: v.baseTier });
          }
        } else if (!(tier.minAmount > 0)) {
          ctx.addIssue({ code: "custom", path: at("minAmount"), message: v.amountRequired });
        }
        if (!hasConditions(tier)) {
          if (seenUnconditioned.has(tier.minAmount)) {
            ctx.addIssue({ code: "custom", path: at("minAmount"), message: v.duplicateAmount });
          }
          seenUnconditioned.add(tier.minAmount);
        }
        if (!allowedConditions.includes("category") && tier.categories.length > 0) {
          ctx.addIssue({ code: "custom", path: at("categories"), message: v.generic });
        }
        if (!allowedConditions.includes("missingCfdi") && tier.missingCfdi) {
          ctx.addIssue({ code: "custom", path: at("missingCfdi"), message: v.generic });
        }
        if (!allowedConditions.includes("manualAdjustments") && tier.manualAdjustments) {
          ctx.addIssue({ code: "custom", path: at("manualAdjustments"), message: v.generic });
        }
        if (!tier.requiresApproval) {
          if (!conceptAllowsNoApprovalTier(concept)) {
            ctx.addIssue({ code: "custom", path: at("requiresApproval"), message: v.approvalRequired });
          }
          return;
        }
        if (tier.steps.length === 0) {
          ctx.addIssue({ code: "custom", path: at("steps", 0), message: v.stepEmpty });
        }
        tier.steps.slice(0, maxSteps).forEach((step, j) => {
          if (step.eligibleRoles.length === 0 && step.eligibleUserIds.length === 0) {
            ctx.addIssue({ code: "custom", path: at("steps", j), message: v.stepEmpty });
          } else if (step.eligibleRoles.some((role) => !ceiling.includes(role))) {
            ctx.addIssue({ code: "custom", path: at("steps", j), message: v.roleOutsideCeiling });
          }
        });
        if (tier.steps.length > maxSteps) {
          ctx.addIssue({ code: "custom", path: at("steps", maxSteps), message: v.generic });
        }
      });
    });
}

export function emptyStep(concept: ApprovalConcept): PolicyFormStep {
  return { eligibleRoles: [...getConceptCeilingRoles(concept)], eligibleUserIds: [] };
}

export function emptyTier(concept: ApprovalConcept, minAmount: number): PolicyFormTier {
  return {
    minAmount,
    requiresApproval: true,
    categories: [],
    missingCfdi: false,
    manualAdjustments: false,
    steps: [emptyStep(concept)],
  };
}

/** Tramos ordenados por monto para editar; el base queda primero. */
export function rulesToFormValues(rules: ApprovalRules): PolicyFormValues {
  const tiers = [...rules.tiers]
    .map((tier, index) => ({ tier, index }))
    .sort((a, b) => a.tier.minAmount - b.tier.minAmount || a.index - b.index)
    .map(({ tier }) => ({
      minAmount: tier.minAmount,
      requiresApproval: tier.requiresApproval,
      categories: [...(tier.conditions.categories ?? [])],
      missingCfdi: tier.conditions.missingCfdi === true,
      manualAdjustments: tier.conditions.manualAdjustments === true,
      steps: tier.steps.map((step) => ({
        eligibleRoles: [...step.eligibleRoles],
        eligibleUserIds: [...step.eligibleUserIds],
      })),
    }));
  return { tiers };
}

export function formValuesToRules(values: PolicyFormValues): ApprovalRules {
  return {
    rulesSchemaVersion: APPROVAL_RULES_SCHEMA_VERSION,
    tiers: values.tiers.map((tier) => ({
      minAmount: Number(tier.minAmount) || 0,
      conditions: {
        ...(tier.categories.length > 0 ? { categories: [...tier.categories] } : {}),
        ...(tier.missingCfdi ? { missingCfdi: true as const } : {}),
        ...(tier.manualAdjustments ? { manualAdjustments: true as const } : {}),
      },
      requiresApproval: tier.requiresApproval,
      steps: tier.requiresApproval
        ? tier.steps.map((step) => ({
            eligibleRoles: [...step.eligibleRoles],
            eligibleUserIds: [...step.eligibleUserIds],
          }))
        : [],
    })),
  };
}

/**
 * Ruta de formulario para un error del API. Las violaciones del API usan el
 * índice de tramo del body enviado, que es el mismo orden del formulario.
 */
export function serverIssuePathToField(path: ReadonlyArray<string | number>): string | null {
  const tierAt = path.indexOf("tiers");
  if (tierAt === -1 || typeof path[tierAt + 1] !== "number") return null;
  const tier = path[tierAt + 1] as number;
  if (path[tierAt + 2] === "steps" && typeof path[tierAt + 3] === "number") {
    return `tiers.${tier}.steps.${path[tierAt + 3] as number}`;
  }
  if (path[tierAt + 2] === "min_amount") return `tiers.${tier}.minAmount`;
  return null;
}
