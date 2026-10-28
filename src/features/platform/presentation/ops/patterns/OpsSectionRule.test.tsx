import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsSectionRule } from "./OpsSectionRule";

describe("OpsSectionRule (L2 M1)", () => {
  it("renders mono label, hairline and meta", () => {
    const { container } = render(
      <div className="platform-ops">
        <OpsSectionRule label="Colas" meta="Actualizado ahora" />
      </div>,
    );

    expect(screen.getByTestId("ops-section-rule")).toBeInTheDocument();
    expect(screen.getByText("Colas")).toHaveClass("ops-section-rule-label");
    expect(screen.getByText("Actualizado ahora")).toHaveClass(
      "ops-section-rule-meta",
    );
    expect(container.querySelector(".ops-section-rule-line")).toBeTruthy();
  });
});
