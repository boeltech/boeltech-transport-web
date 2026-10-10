import type {
  CompensationTemplateRule,
  TemplateDeduction,
  TemplateFixedAllowance,
} from "../../domain/entities";

export interface TariffPreset {
  id: string;
  name: string;
  description: string;
  iconName: "truck" | "car" | "container" | "pencil";
  suggestedName: string;
  rules: CompensationTemplateRule[];
  fixedAllowances: TemplateFixedAllowance[];
  deductions?: TemplateDeduction[];
}

export const TARIFF_PRESETS: TariffPreset[] = [
  {
    id: "long_haul",
    name: "Operador Foráneo",
    description: "Pago por km recorrido + mínimo garantizado + comidas",
    iconName: "truck",
    suggestedName: "Operador Foráneo Estándar",
    rules: [
      {
        routeType: "long_haul",
        commissionType: "rate_per_km",
        rateValue: 3,
        minimumGuaranteedAmount: 400,
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
      {
        allowanceType: "per_diem",
        label: "Viáticos",
        amount: 300,
        period: "weekly",
        isMandatory: true,
      },
    ],
    deductions: [
      {
        deductionType: "savings_fund",
        label: "Fondo de ahorro",
        amount: 200,
        period: "weekly",
        isMandatory: true,
      },
    ],
  },
  {
    id: "local",
    name: "Operador Local",
    description: "Importe fijo por viaje + comidas",
    iconName: "car",
    suggestedName: "Operador Local Estándar",
    rules: [
      {
        routeType: "local",
        commissionType: "fixed_per_trip",
        rateValue: 500,
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
    id: "percentage",
    name: "Operador Tractocamión",
    description: "Porcentaje del flete + viáticos",
    iconName: "container",
    suggestedName: "Operador Tractocamión Estándar",
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
      {
        allowanceType: "tolls_allowance",
        label: "Casetas",
        amount: 400,
        period: "weekly",
        isMandatory: false,
      },
    ],
  },
];

export const BLANK_PRESET_ID = "blank";
