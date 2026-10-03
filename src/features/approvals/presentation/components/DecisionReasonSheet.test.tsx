import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  DECISION_REASON_MAX_LENGTH,
  DecisionReasonSheet,
} from "./DecisionReasonSheet";

const returnCopy = approvalsCopy.returnSheet;
const rejectCopy = approvalsCopy.rejectSheet;

const item: ApprovableItem = {
  approvableType: "trip_expense",
  id: "expense-1",
  amount: 500,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-001",
    driverId: null,
    driverFullName: null,
    vehicleId: null,
    vehicleUnitNumber: null,
    expenseCategory: "fuel",
    description: null,
    occurredAt: "2026-06-01T09:00:00.000Z",
  },
};

function renderSheet(props: Partial<ComponentProps<typeof DecisionReasonSheet>> = {}) {
  const onSubmit = vi.fn();
  render(
    <DecisionReasonSheet
      mode="return"
      open
      onOpenChange={vi.fn()}
      item={item}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit };
}

describe("DecisionReasonSheet · devolver", () => {
  it("«Falta comprobante» deja listo Devolver en 2 clics", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderSheet();

    expect(screen.getByText(returnCopy.title("trip_expense"))).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: returnCopy.submit });
    expect(submit).toBeDisabled();

    await user.click(
      screen.getByRole("radio", { name: returnCopy.reasonCodes.missing_receipt }),
    );
    expect(screen.getByLabelText(returnCopy.reasonLabel)).toHaveValue(
      returnCopy.reasonCodes.missing_receipt,
    );
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith(
      { reason: returnCopy.reasonCodes.missing_receipt, reasonCode: "missing_receipt" },
      [item],
    );
  });

  it("muestra solo los motivos rápidos del tipo", () => {
    renderSheet({ type: "driver_advance_request" });
    const radios = screen.getAllByRole("radio").map((radio) => radio.textContent);
    expect(radios).toEqual([
      returnCopy.reasonCodes.wrong_amount,
      returnCopy.reasonCodes.wrong_operator,
      returnCopy.reasonCodes.other,
    ]);
  });

  it("cambiar de motivo rápido reemplaza el prellenado pero no el texto propio", async () => {
    const user = userEvent.setup();
    renderSheet();
    const textarea = screen.getByLabelText(returnCopy.reasonLabel);

    await user.click(
      screen.getByRole("radio", { name: returnCopy.reasonCodes.missing_receipt }),
    );
    await user.click(screen.getByRole("radio", { name: returnCopy.reasonCodes.wrong_amount }));
    expect(textarea).toHaveValue(returnCopy.reasonCodes.wrong_amount);

    await user.click(screen.getByRole("radio", { name: returnCopy.reasonCodes.other }));
    expect(textarea).toHaveValue("");

    await user.type(textarea, "El ticket es de otra fecha");
    await user.click(
      screen.getByRole("radio", { name: returnCopy.reasonCodes.missing_receipt }),
    );
    expect(textarea).toHaveValue("El ticket es de otra fecha");
  });

  it("sin motivo rápido envía reasonCode «other»", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderSheet();

    await user.type(screen.getByLabelText(returnCopy.reasonLabel), "Revisa el monto");
    await user.click(screen.getByRole("button", { name: returnCopy.submit }));
    expect(onSubmit).toHaveBeenCalledWith(
      { reason: "Revisa el monto", reasonCode: "other" },
      [item],
    );
  });

  it("masiva: título plural y el mismo motivo para todos", async () => {
    const user = userEvent.setup();
    const second = { ...item, id: "expense-2" };
    const { onSubmit } = renderSheet({ item: null, bulkItems: [item, second] });

    expect(screen.getByText(returnCopy.titleBulk(2, "trip_expense"))).toBeInTheDocument();
    await user.click(
      screen.getByRole("radio", { name: returnCopy.reasonCodes.missing_receipt }),
    );
    await user.click(screen.getByRole("button", { name: returnCopy.submit }));
    expect(onSubmit).toHaveBeenCalledWith(
      { reason: returnCopy.reasonCodes.missing_receipt, reasonCode: "missing_receipt" },
      [item, second],
    );
  });
});

describe("DecisionReasonSheet · rechazar", () => {
  it("avisa que es terminal y no manda reasonCode", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderSheet({ mode: "reject" });

    expect(screen.getByText(rejectCopy.terminalWarning)).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(rejectCopy.reasonLabel), "Gasto duplicado");
    await user.click(screen.getByRole("button", { name: rejectCopy.submit }));
    expect(onSubmit).toHaveBeenCalledWith({ reason: "Gasto duplicado" }, [item]);
  });

  it("5 caracteres mínimo (sin contar espacios) y error ligado al campo", async () => {
    const user = userEvent.setup();
    renderSheet({ mode: "reject" });
    const textarea = screen.getByLabelText(rejectCopy.reasonLabel);
    const submit = screen.getByRole("button", { name: rejectCopy.submit });

    await user.type(textarea, "  ab  ");
    expect(submit).toBeDisabled();
    await user.tab();
    expect(await screen.findByText(rejectCopy.reasonTooShort)).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      "reject-expense-reason-counter reject-expense-reason-error",
    );
  });

  it("no acepta más de 500 caracteres", () => {
    renderSheet({ mode: "reject" });
    const textarea = screen.getByLabelText(rejectCopy.reasonLabel);
    fireEvent.change(textarea, { target: { value: "x".repeat(600) } });
    expect((textarea as HTMLTextAreaElement).value).toHaveLength(DECISION_REASON_MAX_LENGTH);
  });
});
