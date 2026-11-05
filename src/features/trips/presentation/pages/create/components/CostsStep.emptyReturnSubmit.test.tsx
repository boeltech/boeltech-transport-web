import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { wizardCopy } from "../../../copy";
import type { TripExpenseFormValues, TripWizardFormValues } from "./validation";
import { defaultWizardFormValues } from "./validation";

type SheetSubmit = (
  values: TripExpenseFormValues,
  editingIndex: number | null,
  options?: { keepOpen?: boolean; companion?: TripExpenseFormValues },
) => void;

const sheetDouble = vi.hoisted(() => ({
  onSubmit: undefined as SheetSubmit | undefined,
  onOpenChange: undefined as ((open: boolean) => void) | undefined,
  isSubmitting: false,
  sawSubmitting: false,
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined }),
}));

vi.mock("@features/clients/application", () => ({
  useClientCreditSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("../../../components/trip-costs", () => ({
  TripExpenseEditableList: () => null,
}));

vi.mock("../../../components/trip-financial", async () => {
  const categories = await import(
    "../../../components/trip-financial/expenseCategories"
  );
  const summary = await import(
    "../../../components/trip-financial/financialSummary"
  );
  const snapshot = await import(
    "../../../components/trip-financial/tripWizardFinancialSnapshot"
  );
  return {
    ...categories,
    ...summary,
    ...snapshot,
    TripResultStrip: () => null,
    TripWizardFinancialSummary: () => null,
    TripExpenseSheet: (props: {
      onSubmit: SheetSubmit;
      onOpenChange: (open: boolean) => void;
      isSubmitting?: boolean;
    }) => {
      sheetDouble.onSubmit = props.onSubmit;
      sheetDouble.onOpenChange = props.onOpenChange;
      sheetDouble.isSubmitting = props.isSubmitting === true;
      if (props.isSubmitting) sheetDouble.sawSubmitting = true;
      return null;
    },
  };
});

import { CostsStep } from "./CostsStep";

function expense(
  description: string,
  isEmptyReturn: boolean,
): TripExpenseFormValues {
  return {
    category: "fuel",
    description,
    amount: 100,
    currency: "MXN",
    paymentSource: "company",
    isEmptyReturn,
  };
}

function CostsStepHarness({
  formRef,
}: {
  formRef: { current: UseFormReturn<TripWizardFormValues> | null };
}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: defaultWizardFormValues,
  });
  const expensesFieldArray = useFieldArray({
    control: form.control,
    name: "expenses",
  });
  useEffect(() => {
    formRef.current = form;
  }, [form, formRef]);

  return (
    <CostsStep
      form={
        form as UseFormReturn<TripWizardFormValues, unknown, TripWizardFormValues>
      }
      expensesFieldArray={expensesFieldArray}
    />
  );
}

function renderCostsStep() {
  const formRef: { current: UseFormReturn<TripWizardFormValues> | null } = {
    current: null,
  };
  render(<CostsStepHarness formRef={formRef} />);
  return {
    expenses: () => formRef.current?.getValues("expenses") ?? [],
  };
}

function requireSubmit(): SheetSubmit {
  const submit = sheetDouble.onSubmit;
  if (!submit) throw new Error("TripExpenseSheet no recibió onSubmit");
  return submit;
}

function submitPair(
  submit: SheetSubmit,
  options?: { keepOpen?: boolean },
) {
  submit(expense("Combustible de ruta", false), null, {
    ...options,
    companion: expense("Combustible de regreso", true),
  });
}

describe("CostsStep empty-return sheet submit", () => {
  beforeEach(() => {
    sheetDouble.onSubmit = undefined;
    sheetDouble.onOpenChange = undefined;
    sheetDouble.isSubmitting = false;
    sheetDouble.sawSubmitting = false;
  });

  it("keeps one fuel pair when the sheet submits twice without keepOpen", () => {
    const view = renderCostsStep();
    const submit = requireSubmit();

    act(() => {
      submitPair(submit);
      submitPair(submit);
    });

    expect(view.expenses().map((item) => item.description)).toEqual([
      "Combustible de ruta",
      "Combustible de regreso",
    ]);
    expect(sheetDouble.sawSubmitting).toBe(true);
  });

  it("appends another pair after the sheet closes", () => {
    const view = renderCostsStep();
    const submit = requireSubmit();

    act(() => {
      submitPair(submit);
      submitPair(submit);
    });
    expect(view.expenses()).toHaveLength(2);

    act(() => {
      sheetDouble.onOpenChange?.(false);
    });
    act(() => {
      submitPair(requireSubmit());
    });

    expect(view.expenses().map((item) => item.description)).toEqual([
      "Combustible de ruta",
      "Combustible de regreso",
      "Combustible de ruta",
      "Combustible de regreso",
    ]);
  });

  it("accepts another pair after keep-open once the submit lock releases", () => {
    const view = renderCostsStep();
    fireEvent.click(
      screen.getByRole("button", {
        name: wizardCopy.costs.action.addOperational,
      }),
    );

    const route = expense("Combustible de ruta", false);
    const back = expense("Combustible de regreso", true);
    const submit = requireSubmit();

    act(() => {
      submit(route, null, { keepOpen: true, companion: back });
      submit(route, null, { keepOpen: true, companion: back });
    });

    expect(view.expenses()).toHaveLength(2);
    expect(sheetDouble.isSubmitting).toBe(false);

    act(() => {
      sheetDouble.onSubmit?.(route, null, { keepOpen: true, companion: back });
    });

    expect(view.expenses()).toHaveLength(4);
  });
});
