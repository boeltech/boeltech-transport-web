import type { WizardStep } from "@shared/ui/wizard";

export const EMPLOYEE_WIZARD_STEPS: WizardStep[] = [
  { id: "personal", title: "Personal", description: "Identidad y datos fiscales" },
  { id: "contact", title: "Contacto", description: "Medios y domicilio" },
  { id: "employment", title: "Laboral", description: "Puesto y condiciones" },
  { id: "compensation", title: "Compensación", description: "Salario y banco" },
  { id: "review", title: "Revisión", description: "Confirmar antes de guardar" },
];
