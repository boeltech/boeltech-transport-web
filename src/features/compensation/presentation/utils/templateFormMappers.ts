import type {
  CompensationTemplate,
  CreateCompensationTemplatePayload,
} from "../../domain/entities";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";

export const TEMPLATE_FORM_ID = "compensation-template-form";

export function templateInlineFormId(templateId: string): string {
  return `${TEMPLATE_FORM_ID}-${templateId}`;
}

export const DEFAULT_TEMPLATE_RULES: CompensationTemplateFormData["rules"] = [
  {
    routeType: "long_haul",
    commissionType: "rate_per_km",
    rateValue: 3,
    minimumGuaranteedAmount: 0,
    notes: null,
  },
];

export const DEFAULT_TEMPLATE_FORM_VALUES: CompensationTemplateFormData = {
  name: "",
  description: "",
  isActive: true,
  midTripPayoutPolicy: "split_by_assigned_km",
  rules: DEFAULT_TEMPLATE_RULES,
  fixedAllowances: [],
  corridorIds: [],
};

export function templateToForm(
  template: CompensationTemplate,
): CompensationTemplateFormData {
  return {
    name: template.name,
    description: template.description ?? "",
    isActive: template.isActive,
    midTripPayoutPolicy: template.midTripPayoutPolicy ?? "split_by_assigned_km",
    rules: template.rules.map((rule) => ({
      routeType: rule.routeType,
      commissionType: rule.commissionType,
      rateValue: rule.rateValue,
      minimumGuaranteedAmount: rule.minimumGuaranteedAmount,
      notes: rule.notes ?? null,
    })),
    fixedAllowances: template.fixedAllowances.map((allowance) => ({
      allowanceType: allowance.allowanceType,
      label: allowance.label,
      amount: allowance.amount,
      period: allowance.period,
      isMandatory: allowance.isMandatory,
    })),
    corridorIds: [...template.corridorIds],
  };
}

export function buildDuplicateTemplatePayload(
  template: CompensationTemplate,
  nameSuffix: string,
): CreateCompensationTemplatePayload {
  const name = `${template.name} ${nameSuffix}`.trim().slice(0, 120);

  return {
    name,
    description: template.description ?? null,
    isActive: template.isActive,
    midTripPayoutPolicy: template.midTripPayoutPolicy,
    rules: template.rules.map((rule) => ({
      routeType: rule.routeType,
      commissionType: rule.commissionType,
      rateValue: rule.rateValue,
      minimumGuaranteedAmount: rule.minimumGuaranteedAmount,
      notes: rule.notes ?? null,
    })),
    fixedAllowances: template.fixedAllowances.map((allowance) => ({
      allowanceType: allowance.allowanceType,
      label: allowance.label,
      amount: allowance.amount,
      period: allowance.period,
      isMandatory: allowance.isMandatory,
    })),
    corridorIds: [...template.corridorIds],
  };
}
