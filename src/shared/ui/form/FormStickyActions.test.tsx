import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormStickyActions } from "./FormStickyActions";

describe("FormStickyActions", () => {
  it("aplica sticky inferior por defecto", () => {
    const { container } = render(
      <FormStickyActions>
        <button type="button">Guardar</button>
      </FormStickyActions>,
    );

    const footer = container.firstElementChild;
    expect(footer).toHaveClass("sticky", "bottom-0");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("permite desactivar sticky", () => {
    const { container } = render(
      <FormStickyActions sticky={false}>
        <button type="button">Guardar</button>
      </FormStickyActions>,
    );

    const footer = container.firstElementChild;
    expect(footer).not.toHaveClass("sticky");
    expect(footer).toHaveClass("border-t");
  });
});
