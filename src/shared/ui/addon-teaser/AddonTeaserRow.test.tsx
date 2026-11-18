import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { Radio } from "lucide-react";

import { EntitlementBadge } from "@shared/ui/entitlement-badge";
import { AddonTeaserRow } from "./AddonTeaserRow";

describe("AddonTeaserRow", () => {
  it("renders title, description, kind badge and optional CTA", () => {
    render(
      <MemoryRouter>
        <AddonTeaserRow
          icon={<Radio className="h-4 w-4" />}
          title="Monitoreo GPS"
          badge={<EntitlementBadge variant="kind" />}
          description="Ve dónde está esta unidad y su recorrido."
          action={
            <Link to="/monitoring/fleet" data-testid="addon-teaser-cta">
              Conocer Monitoreo GPS
            </Link>
          }
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("addon-teaser-row")).toBeInTheDocument();
    expect(screen.getByText("Monitoreo GPS")).toBeInTheDocument();
    expect(screen.getByTestId("entitlement-badge-kind")).toHaveTextContent(
      "Complemento",
    );
    expect(
      screen.getByText("Ve dónde está esta unidad y su recorrido."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("addon-teaser-cta")).toHaveAttribute(
      "href",
      "/monitoring/fleet",
    );
  });

  it("omits action when not provided", () => {
    render(
      <AddonTeaserRow
        icon={<Radio className="h-4 w-4" />}
        title="Monitoreo GPS"
        description="Sin enlace"
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
