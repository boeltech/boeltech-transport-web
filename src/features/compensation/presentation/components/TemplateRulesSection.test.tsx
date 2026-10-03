import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { TemplateRulesSection } from "./TemplateRulesSection";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { compensationCopy } from "../copy/compensationCopy";

function RulesHarness({
  defaultRules,
}: {
  defaultRules: CompensationTemplateFormData["rules"];
}) {
  const form = useForm<CompensationTemplateFormData>({
    defaultValues: {
      name: "Demo",
      description: null,
      isActive: true,
      midTripPayoutPolicy: "split_by_assigned_km",
      rules: defaultRules,
      fixedAllowances: [],
      deductions: [],
      corridorIds: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules",
  });
  const watchedRules = useWatch({ control: form.control, name: "rules" });

  return (
    <FormProvider {...form}>
      <TemplateRulesSection
        control={form.control}
        ruleFields={fields}
        watchedRules={watchedRules}
        appendRule={append}
        removeRule={remove}
        stepPrefix=""
      />
    </FormProvider>
  );
}

describe("TemplateRulesSection", () => {
  it("muestra % en el campo Porcentaje y MXN solo en mínimo garantizado", () => {
    render(
      <RulesHarness
        defaultRules={[
          {
            routeType: "local",
            commissionType: "percentage_of_freight",
            rateValue: 30,
            minimumGuaranteedAmount: 0,
            notes: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("%")).toBeInTheDocument();
    // El mínimo garantizado sigue en moneda.
    expect(screen.getAllByText("MXN")).toHaveLength(1);
  });

  it("deshabilita agregar regla cuando ya hay una por cada clase de ruta", () => {
    render(
      <RulesHarness
        defaultRules={[
          {
            routeType: "local",
            commissionType: "rate_per_km",
            rateValue: 3,
            minimumGuaranteedAmount: 0,
            notes: null,
          },
          {
            routeType: "long_haul",
            commissionType: "fixed_per_trip",
            rateValue: 500,
            minimumGuaranteedAmount: 0,
            notes: null,
          },
          {
            routeType: "transfer",
            commissionType: "none",
            rateValue: 0,
            minimumGuaranteedAmount: 0,
            notes: null,
          },
        ]}
      />,
    );

    const addButton = screen.getByRole("button", {
      name: compensationCopy.sheet.addRule,
    });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute(
      "title",
      compensationCopy.builder.addRuleDisabledAllTypes,
    );
  });

  it("agrega la siguiente regla con un routeType disponible", async () => {
    const user = userEvent.setup();
    render(
      <RulesHarness
        defaultRules={[
          {
            routeType: "local",
            commissionType: "rate_per_km",
            rateValue: 3,
            minimumGuaranteedAmount: 0,
            notes: null,
          },
        ]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: compensationCopy.sheet.addRule }),
    );

    // Header de la tarjeta + valor del Select.
    expect(
      screen.getAllByText(compensationCopy.builder.routeTypeLabels.long_haul)
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Quitar/i })).toHaveLength(2);
  });
});
