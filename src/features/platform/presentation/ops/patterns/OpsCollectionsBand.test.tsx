import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsButton } from "../ui/OpsButton";
import { OpsCollectionsBand } from "./OpsCollectionsBand";

describe("OpsCollectionsBand", () => {
  it("keeps danger on the overdue bucket and one action", () => {
    render(
      <div className="platform-ops">
        <OpsCollectionsBand
          buckets={[
            { id: "current", label: "Al corriente", cents: 1190000 },
            { id: "d30", label: "1–30 días", cents: 0 },
            { id: "overdue", label: "Atrasados", cents: 1240000, overdue: true },
          ]}
          action={
            <OpsButton variant="ghost" size="sm">
              Ver en Cobros
            </OpsButton>
          }
        />
      </div>,
    );

    const band = screen.getByTestId("ops-collections-band");
    const buckets = band.querySelectorAll("[data-ops-collections-bucket]");
    expect(buckets).toHaveLength(3);
    expect(buckets[0]).toHaveAttribute("data-overdue", "false");
    expect(buckets[1]).toHaveAttribute("data-overdue", "false");
    expect(buckets[2]).toHaveAttribute("data-overdue", "true");
    expect(band.querySelectorAll("table")).toHaveLength(0);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Ver en Cobros" })).toBeInTheDocument();
  });

  it("shows a muted empty line instead of nothing", () => {
    render(
      <div className="platform-ops">
        <OpsCollectionsBand buckets={[]} />
      </div>,
    );

    expect(screen.getByTestId("ops-collections-band")).toHaveTextContent(
      "Sin saldo",
    );
    expect(screen.getByText("Sin saldo")).toHaveClass("ops-text-muted");
  });
});
