import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { tripDetailCopy } from "../../copy";
import { TripRouteDistancesCard } from "./TripRouteDistancesCard";

const copy = tripDetailCopy.route;

describe("TripRouteDistancesCard", () => {
  it("renders segments, total planeado and billing note", () => {
    render(
      <TripRouteDistancesCard
        segments={[
          {
            id: "a",
            fromLabel: "Monterrey",
            toLabel: "Saltillo",
            km: 86,
          },
          {
            id: "b",
            fromLabel: "Saltillo",
            toLabel: "Torreón",
            km: 266,
          },
        ]}
        totalKm={352}
      />,
    );

    expect(screen.getByText(copy.section.distances)).toBeInTheDocument();
    expect(screen.getByText("Monterrey")).toBeInTheDocument();
    expect(screen.getByText("→ Saltillo")).toBeInTheDocument();
    expect(screen.getByText(copy.label.totalPlanned)).toBeInTheDocument();
    expect(screen.getByText(copy.hint.distancesBilling)).toBeInTheDocument();
    expect(screen.getByText("352 km")).toBeInTheDocument();
  });

  it("stacks long names without truncating the combined from→to string", () => {
    const from = "Tecnológico de Monterrey Campus Santa Fe";
    const to = "Vórtice iTech Park";
    const { container } = render(
      <TripRouteDistancesCard
        segments={[{ id: "long", fromLabel: from, toLabel: to, km: 226.6 }]}
        totalKm={226.6}
      />,
    );

    expect(screen.getByText(from)).toBeInTheDocument();
    expect(screen.getByText(`→ ${to}`)).toBeInTheDocument();
    expect(screen.getAllByText("226.6 km")).toHaveLength(2);

    const truncatedCombined = container.querySelector(".truncate");
    expect(truncatedCombined).toBeNull();

    expect(
      screen.getByLabelText(
        `${copy.format.segmentArrow(from, to)}, ${copy.format.distanceKm("226.6")}`,
      ),
    ).toBeInTheDocument();
  });

  it("keeps a stable 2-line stack for short names and exposes full a11y name", () => {
    render(
      <TripRouteDistancesCard
        segments={[
          {
            id: "short",
            fromLabel: "Monterrey",
            toLabel: "Saltillo",
            km: 86,
          },
        ]}
        totalKm={86}
      />,
    );

    expect(screen.getByText("Monterrey")).toBeInTheDocument();
    expect(screen.getByText("→ Saltillo")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        `${copy.format.segmentArrow("Monterrey", "Saltillo")}, ${copy.format.distanceKm("86")}`,
      ),
    ).toBeInTheDocument();
  });
});
