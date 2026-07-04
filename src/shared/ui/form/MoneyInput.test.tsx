import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { formatMoneyAmountOnly, MoneyInput } from "./MoneyInput";

describe("formatMoneyAmountOnly", () => {
  it("formatea sin símbolo de moneda", () => {
    expect(formatMoneyAmountOnly(28000, "es-MX", 2)).toBe("28,000.00");
  });
});

describe("MoneyInput", () => {
  it("muestra cantidad sin $ en blur cuando el badge es MXN", () => {
    render(<MoneyInput value={28000} onValueChange={() => undefined} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("28,000.00");
    expect(input).not.toHaveValue("$28,000.00");
  });

  it("entra en modo edición al enfocar y vuelve a amount-only al blur", async () => {
    const user = userEvent.setup();
    render(<MoneyInput value={25000} onValueChange={() => undefined} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    expect(input).toHaveValue("25000");

    await user.tab();
    expect(input).toHaveValue("25,000.00");
  });
});
