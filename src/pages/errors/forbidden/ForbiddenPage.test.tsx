import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ForbiddenPage from "./ForbiddenPage";

describe("ForbiddenPage", () => {
  it("muestra Ir a Inicio (H-U10-N04)", () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /Ir a Inicio/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ir al Dashboard")).not.toBeInTheDocument();
  });
});
