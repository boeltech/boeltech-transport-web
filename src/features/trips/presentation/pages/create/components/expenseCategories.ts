import type { LucideIcon } from "lucide-react";
import {
  Bed,
  CircleDollarSign,
  FileText,
  Fuel,
  MoreHorizontal,
  Package,
  ParkingCircle,
  Shield,
  Wallet,
  Wrench,
} from "lucide-react";

import {
  type ExpenseCategory,
  INDIRECT_EXPENSE_CATEGORIES,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  OPERATIONAL_COST_CATEGORIES,
} from "./financialSummary";

export type TripExpenseSheetKind = "cost" | "expense";

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "fuel", label: "Combustible", icon: Fuel },
  { value: "tolls", label: "Casetas/Peajes", icon: CircleDollarSign },
  { value: "driver_allowance", label: "Viáticos del Operador", icon: Wallet },
  { value: "lodging", label: "Hospedaje", icon: Bed },
  { value: "loading_unloading", label: "Maniobras Carga/Descarga", icon: Package },
  { value: "parking", label: "Pensión/Estacionamiento", icon: ParkingCircle },
  { value: "maintenance", label: "Mantenimiento en Ruta", icon: Wrench },
  { value: "insurance", label: "Seguros", icon: Shield },
  { value: "permits", label: "Permisos y Trámites", icon: FileText },
  { value: "other", label: "Otros Gastos", icon: MoreHorizontal },
] as const satisfies ReadonlyArray<{
  value: ExpenseCategory;
  label: string;
  icon: LucideIcon;
}>;

export const EXPENSE_CATEGORY_MAP = new Map(
  EXPENSE_CATEGORY_OPTIONS.map((item) => [item.value, item]),
);

export function getDefaultCategoryForKind(kind: TripExpenseSheetKind): ExpenseCategory {
  return kind === "cost" ? "fuel" : "driver_allowance";
}

export function getCategoriesForKind(kind: TripExpenseSheetKind) {
  return EXPENSE_CATEGORY_OPTIONS.filter((item) =>
    kind === "cost"
      ? isOperationalExpenseCategory(item.value)
      : isIndirectExpenseCategory(item.value),
  );
}

export function getSheetKindForCategory(category: string): TripExpenseSheetKind {
  return isOperationalExpenseCategory(category as ExpenseCategory) ? "cost" : "expense";
}

export { OPERATIONAL_COST_CATEGORIES, INDIRECT_EXPENSE_CATEGORIES };
