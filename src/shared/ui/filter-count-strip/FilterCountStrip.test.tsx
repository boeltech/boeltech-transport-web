import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { FilterCountStrip } from "./FilterCountStrip";

describe("FilterCountStrip", () => {
  it("renderiza labels, conteos y deep-links", () => {
    render(
      <MemoryRouter>
        <FilterCountStrip
          items={[
            {
              id: "departing",
              label: "Por salir",
              count: 5,
              href: "/trips?status=scheduled",
            },
            {
              id: "overdue",
              label: "Con retraso",
              count: 2,
              href: "/trips?overdue=1",
              warn: true,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Por salir")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Por salir/ }),
    ).toHaveAttribute("href", "/trips?status=scheduled");
    expect(
      screen.getByRole("link", { name: /Con retraso/ }),
    ).toHaveAttribute("href", "/trips?overdue=1");
  });
});
