/**
 * Register F2 — stepper Operate: progreso teal, trial tip muted una vez.
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { RegisterBrandStepper } from "./RegisterBrandStepper";
import { registerFunnelCopy as copy } from "./registerFunnelCopy";

describe("RegisterBrandStepper F2", () => {
  it("panel: teal progress + muted trial tip with amber signal (once)", () => {
    const { container } = render(
      <RegisterBrandStepper currentStep="plan" variant="panel" />,
    );

    const trial = screen.getByText(copy.trialHint);
    expect(trial).toBeInTheDocument();
    expect(trial.closest("p")).toHaveClass("text-muted-foreground");
    expect(trial.closest("p")?.querySelector(".auth-funnel-trust-tip")).toBeTruthy();
    expect(screen.getAllByText(copy.trialHint)).toHaveLength(1);

    const current = container.querySelector('[aria-current="step"]');
    expect(current).toHaveClass("bg-primary");
  });

  it("compact: progress bars + single muted trial tip", () => {
    const { container } = render(
      <RegisterBrandStepper currentStep="company" variant="compact" />,
    );

    expect(
      screen.getByText(copy.panel.stepOf(1, 4)),
    ).toBeInTheDocument();
    expect(screen.getAllByText(copy.trialHint)).toHaveLength(1);
    expect(screen.getByText(copy.trialHint).closest("p")).toHaveClass(
      "text-muted-foreground",
    );

    const bars = within(
      container.querySelector("ol") as HTMLOListElement,
    ).getAllByRole("listitem");
    expect(bars).toHaveLength(4);
    expect(bars[0]).toHaveClass("bg-primary");
  });
});
