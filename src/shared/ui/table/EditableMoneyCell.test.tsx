import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableMoneyCell } from "./EditableMoneyCell";

describe("EditableMoneyCell", () => {
  it("renders 5+ digit values without overflow hidden", () => {
    render(
      <EditableMoneyCell
        value={19152}
        onValueChange={vi.fn()}
        aria-label="Abono"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Abono" });
    expect(input).toBeDefined();
    expect(input.className).toContain("max-w-[9rem]");
  });

  it("does not truncate formatted value on blur", () => {
    render(
      <EditableMoneyCell
        value={19152}
        onValueChange={vi.fn()}
        aria-label="Abono a factura"
      />,
    );
    const input = screen.getByRole("textbox", {
      name: "Abono a factura",
    }) as HTMLInputElement;
    expect(input.value).toContain("19,152");
  });

  it("does not render MXN badge (currency in header, not per cell)", () => {
    const { container } = render(
      <EditableMoneyCell
        value={500}
        onValueChange={vi.fn()}
        aria-label="Abono"
      />,
    );
    const badge = container.querySelector(
      ".pointer-events-none.absolute",
    );
    expect(badge).toBeNull();
    const input = screen.getByRole("textbox", { name: "Abono" });
    expect(input.className).toContain("pl-3");
    expect(input.className).not.toContain("pl-14");
  });

  it("passes custom className without overriding base classes", () => {
    render(
      <EditableMoneyCell
        value={100}
        onValueChange={vi.fn()}
        aria-label="Test"
        className="bg-red-50"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Test" });
    expect(input.className).toContain("ml-auto");
    expect(input.className).toContain("bg-red-50");
  });
});
