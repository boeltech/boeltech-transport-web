import { Receipt } from "lucide-react";
import type { BadgeProps } from "@shared/ui/badge";
import type { ApprovableType } from "../../domain";

type ApprovalBadgeVariant = Extract<
  NonNullable<BadgeProps["variant"]>,
  "info" | "neutral"
>;

export interface ApprovalTypeConfigEntry {
  label: string;
  icon: typeof Receipt;
  badge: {
    variant: ApprovalBadgeVariant;
    tone?: NonNullable<BadgeProps["tone"]>;
  };
}

export const approvalTypeConfig: Record<ApprovableType, ApprovalTypeConfigEntry> = {
  trip_expense: {
    label: "Gasto de viaje",
    icon: Receipt,
    badge: { variant: "info", tone: "soft" },
  },
  internal_staff_compensation: {
    label: "Compensación interna",
    icon: Receipt,
    badge: { variant: "neutral", tone: "soft" },
  },
  fuel_transaction: {
    label: "Combustible",
    icon: Receipt,
    badge: { variant: "neutral", tone: "soft" },
  },
  maintenance_order: {
    label: "Mantenimiento",
    icon: Receipt,
    badge: { variant: "neutral", tone: "soft" },
  },
  vehicle_doc_renewal: {
    label: "Documentación",
    icon: Receipt,
    badge: { variant: "neutral", tone: "soft" },
  },
  overhead_expense: {
    label: "Gasto corporativo",
    icon: Receipt,
    badge: { variant: "neutral", tone: "soft" },
  },
};
