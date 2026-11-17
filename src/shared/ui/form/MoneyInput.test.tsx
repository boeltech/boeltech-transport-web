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

  it("placeholder idle sin $ (badge ISO ya ancla MXN)", () => {
    render(<MoneyInput onValueChange={() => undefined} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "0.00");
    expect(screen.getByText("MXN")).toBeInTheDocument();
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

  it("renders MXN badge with pl-14 when currencyCode is truthy", () => {
    const { container } = render(
      <MoneyInput value={100} onValueChange={() => undefined} currencyCode="MXN" />,
    );

    expect(screen.getByText("MXN")).toBeInTheDocument();
    const badge = container.querySelector(".pointer-events-none.absolute");
    expect(badge).not.toBeNull();

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("pl-14");
  });

  it("hides badge and uses pl-3 when currencyCode is empty string", () => {
    const { container } = render(
      <MoneyInput value={100} onValueChange={() => undefined} currencyCode="" />,
    );

    const badge = container.querySelector(".pointer-events-none.absolute");
    expect(badge).toBeNull();

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("pl-3");
    expect(input.className).not.toContain("pl-14");
  });
});
