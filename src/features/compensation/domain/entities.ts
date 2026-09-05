import type {
  AgreementCommissionType,
  TripRouteType,
} from "@features/settlements";
import type {
  CorridorRefType,
  FixedAllowancePeriod,
  FixedAllowanceType,
} from "./enums";

export interface CompensationTemplateRule {
  id?: string;
  routeType: TripRouteType;
  commissionType: AgreementCommissionType;
  rateValue: number;
  minimumGuaranteedAmount: number;
  notes?: string | null;
  sortOrder?: number;
}

export interface TemplateFixedAllowance {
  id?: string;
  allowanceType: FixedAllowanceType;
  label: string;
  amount: number;
  period: FixedAllowancePeriod;
  isMandatory: boolean;
}

export interface RouteCorridorTariff {
  id: string;
  name: string;
  originRefType: CorridorRefType;
  originRefValue: string;
  destinationRefType: CorridorRefType;
  destinationRefValue: string;
  fixedAmount: number;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompensationTemplate {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  rules: CompensationTemplateRule[];
  fixedAllowances: TemplateFixedAllowance[];
  corridorIds: string[];
  corridors: RouteCorridorTariff[];
  /** Asignaciones vigentes hoy (isActive + ventana de fechas). */
  activeAssignmentsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateAssignment {
  id: string;
  employeeId: string;
  employeeFullName?: string | null;
  templateId: string;
  templateName?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  assignedBy?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchAssignmentConflict {
  employeeId: string;
  code: string;
  existingAssignmentId?: string;
  message?: string;
}

export interface BatchAssignmentResult {
  createdCount: number;
  skippedCount: number;
  conflicts: BatchAssignmentConflict[];
  created: TemplateAssignment[];
}

export interface CreateCompensationTemplatePayload {
  name: string;
  description?: string | null;
  isActive?: boolean;
  rules?: CompensationTemplateRule[];
  fixedAllowances?: TemplateFixedAllowance[];
  corridorIds?: string[];
}

export interface ReplaceTemplateConfigurationPayload {
  rules: CompensationTemplateRule[];
  fixedAllowances: TemplateFixedAllowance[];
  corridorIds: string[];
}

export interface CreateCorridorTariffPayload {
  name: string;
  originRefType: CorridorRefType;
  originRefValue: string;
  destinationRefType: CorridorRefType;
  destinationRefValue: string;
  fixedAmount: number;
  notes?: string | null;
  isActive?: boolean;
}

export interface BatchTemplateAssignmentPayload {
  templateId: string;
  employeeIds: string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  closePreviousAssignment?: boolean;
  reason?: string | null;
}

export interface FixedAllowanceOverride {
  id: string;
  employeeId: string;
  allowanceId: string;
  periodStart: string;
  periodEnd: string;
  isSuspended: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export interface UpsertFixedAllowanceOverridePayload {
  employeeId: string;
  allowanceId: string;
  periodStart: string;
  periodEnd: string;
  isSuspended: boolean;
}

export interface UpdateTemplateAssignmentPayload {
  isActive?: boolean;
  effectiveTo?: string | null;
}
