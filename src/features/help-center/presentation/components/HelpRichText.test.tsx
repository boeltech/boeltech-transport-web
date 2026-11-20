import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HelpRichText } from "./HelpRichText";

describe("HelpRichText", () => {
  it("renderiza un guide de 3 pasos como ol con list-decimal", () => {
    const guide = "1. Primero\n2. Segundo\n3. Tercero";
    const { container } = render(<HelpRichText markdown={guide} />);

    const root = container.firstElementChild;
    expect(root).toBeTruthy();
    expect(root?.className).toMatch(/\[&_ol\]:list-decimal/);

    const items = container.querySelectorAll("ol > li");
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toBe("Primero");
    expect(items[1]?.textContent).toBe("Segundo");
    expect(items[2]?.textContent).toBe("Tercero");
  });
});
