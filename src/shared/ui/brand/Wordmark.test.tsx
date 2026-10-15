import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Wordmark } from "./Wordmark";

describe("Wordmark", () => {
  it("maps onInk to palette-brand-on-ink (chrome ink / teal-light)", () => {
    const { container } = render(<Wordmark variant="onInk" decorative />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("text-palette-brand-on-ink");
    expect(el.className).not.toContain("text-primary-foreground");
    expect(el.className).not.toContain("text-primary");
    expect(el.className).not.toContain("text-sidebar-foreground");
  });

  it("maps onBrand to primary-foreground (bg-primary only)", () => {
    const { container } = render(<Wordmark variant="onBrand" decorative />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("text-primary-foreground");
    expect(el.className).not.toContain("text-palette-brand-on-ink");
  });
});
