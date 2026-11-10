import type {
  CompensationTemplateRule,
  TemplateDeduction,
  TemplateFixedAllowance,
} from "../../domain/entities";
import type { TemplatePaymentPeriod } from "../../domain/enums";

export interface TariffPreset {
  id: string;
  name: string;
  description: string;
  iconName: "truck" | "percent" | "map-pin" | "calendar" | "pencil";
  suggestedName: string;
  formulaMini: string;
  /** Q2 / T10 */
  salaryOnly?: boolean;
  defaultPaymentPeriod?: TemplatePaymentPeriod;
  rules: CompensationTemplateRule[];
  fixedAllowances: TemplateFixedAllowance[];
  deductions?: TemplateDeduction[];
}

export const TARIFF_PRESETS: TariffPreset[] = [
  {
    id: "long_haul",
    name: "Por kilómetro recorrido",
    description:
      "Foráneo a $3.00 por km con mínimo por viaje, más comidas y viáticos.",
    iconName: "truck",
    suggestedName: "Foráneo estándar",
    formulaMini: "km × tarifa (mín. por viaje) + fijos − descuentos",
    defaultPaymentPeriod: "weekly",
    rules: [
      {
        routeType: "long_haul",
        commissionType: "rate_per_km",
        rateValue: 3,
        minimumGuaranteedAmount: 1500,
      },
    ],
    fixedAllowances: [
      {
        allowanceType: "meals",
        label: "Comidas",
        amount: 700,
        period: "weekly",
        isMandatory: true,
      },
      {
        allowanceType: "per_diem",
        label: "Viáticos",
        amount: 500,
        period: "weekly",
        isMandatory: true,
      },
    ],
    deductions: [
      {
        deductionType: "savings_fund",
        label: "Fondo de ahorro",
        amount: 350,
        period: "weekly",
        isMandatory: true,
      },
    ],
  },
  {
    id: "percentage",
    name: "Porcentaje del flete",
    description: "Un % de lo que se le cobra al cliente por el viaje, más viáticos.",
    iconName: "percent",
    suggestedName: "Porcentaje del flete",
    formulaMini: "% del flete + fijos − descuentos",
    defaultPaymentPeriod: "weekly",
    rules: [
      {
        routeType: "long_haul",
        commissionType: "percentage_of_freight",
        rateValue: 8,
        minimumGuaranteedAmount: 0,
      },
    ],
    fixedAllowances: [
      {
        allowanceType: "transport",
        label: "Viáticos",
        amount: 800,
        period: "weekly",
        isMandatory: true,
      },
    ],
  },
  {
    id: "local",
    name: "Importe fijo por viaje o por ruta",
    description: "Cada viaje paga lo mismo, o cada ruta tiene su precio.",
    iconName: "map-pin",
    suggestedName: "Local / ruta fija",
    formulaMini: "importe del viaje o de la ruta + fijos",
    defaultPaymentPeriod: "weekly",
    rules: [
      {
        routeType: "local",
        commissionType: "fixed_per_trip",
        rateValue: 650,
        minimumGuaranteedAmount: 0,
      },
    ],
    fixedAllowances: [
      {
        allowanceType: "meals",
        label: "Comidas",
        amount: 500,
        period: "weekly",
        isMandatory: true,
      },
    ],
  },
  {
    id: "salary_only",
    name: "Solo sueldo fijo",
    description:
      "No se paga por viaje: el operador recibe un monto fijo cada periodo.",
    iconName: "calendar",
    suggestedName: "Solo sueldo",
    formulaMini: "sueldo del periodo − descuentos",
    salaryOnly: true,
    defaultPaymentPeriod: "weekly",
    rules: [],
    fixedAllowances: [],
    deductions: [],
  },
];

export const BLANK_PRESET_ID = "blank";
