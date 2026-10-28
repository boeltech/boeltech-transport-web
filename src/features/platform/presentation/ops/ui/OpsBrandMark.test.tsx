import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { opsCopy } from "../opsCopy";
import { OpsBrandMark } from "./OpsBrandMark";

function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="platform-ops" data-ops-theme="dark">
      {children}
    </div>
  );
}

describe("OpsBrandMark (L1 M4)", () => {
  it("renders wordmark + monogram without Shield or Ops badge", () => {
    render(
      <OpsShell>
        <OpsBrandMark showEnv />
      </OpsShell>,
    );

    const mark = screen.getByTestId("ops-brand-mark");
    expect(mark).toHaveAttribute("data-ops-brand", "rail");
    expect(mark).not.toHaveAttribute("aria-label");
    expect(mark.querySelector("[aria-hidden='true']")).toHaveTextContent(
      opsCopy.monogram,
    );
    expect(mark).toHaveTextContent(opsCopy.monogram);
    expect(mark).toHaveTextContent(opsCopy.wordmark);
    expect(mark).toHaveTextContent(opsCopy.envLabel);
    expect(screen.queryByText(/^Ops$/)).not.toBeInTheDocument();
    expect(document.querySelector("svg.lucide-shield")).toBeNull();
  });

  it("hero size marks login protagonist", () => {
    render(
      <OpsShell>
        <OpsBrandMark size="hero" />
      </OpsShell>,
    );

    expect(screen.getByTestId("ops-brand-mark")).toHaveAttribute(
      "data-ops-brand",
      "hero",
    );
  });
});
