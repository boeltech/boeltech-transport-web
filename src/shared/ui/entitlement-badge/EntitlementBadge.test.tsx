import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  EntitlementBadge,
  ENTITLEMENT_BADGE_LABELS,
  type EntitlementBadgeVariant,
} from "./EntitlementBadge";

const VARIANTS: readonly EntitlementBadgeVariant[] = [
  "active",
  "available",
  "unavailable",
  "early_access",
  "kind",
] as const;

describe("EntitlementBadge", () => {
  it.each(VARIANTS)("renders canonical label for %s", (variant) => {
    render(<EntitlementBadge variant={variant} />);
    expect(
      screen.getByTestId(`entitlement-badge-${variant}`),
    ).toHaveTextContent(ENTITLEMENT_BADGE_LABELS[variant].label);
  });

  it("allows sentence-case label override", () => {
    render(
      <EntitlementBadge variant="available">Disponible</EntitlementBadge>,
    );
    expect(screen.getByTestId("entitlement-badge-available")).toHaveTextContent(
      "Disponible",
    );
  });

  it("maps status variants to soft semantic tones (kind = outline)", () => {
    const { rerender } = render(<EntitlementBadge variant="active" />);
    expect(screen.getByTestId("entitlement-badge-active").className).toMatch(
      /success/,
    );

    rerender(<EntitlementBadge variant="available" />);
    expect(screen.getByTestId("entitlement-badge-available").className).toMatch(
      /neutral/,
    );

    rerender(<EntitlementBadge variant="unavailable" />);
    expect(
      screen.getByTestId("entitlement-badge-unavailable").className,
    ).toMatch(/neutral/);

    rerender(<EntitlementBadge variant="early_access" />);
    expect(
      screen.getByTestId("entitlement-badge-early_access").className,
    ).toMatch(/info/);

    rerender(<EntitlementBadge variant="kind" />);
    expect(screen.getByTestId("entitlement-badge-kind").className).toMatch(
      /border|outline|foreground/,
    );
  });
});
