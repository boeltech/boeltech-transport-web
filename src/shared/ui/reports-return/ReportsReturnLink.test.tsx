import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ReportsReturnLink } from "./ReportsReturnLink";

describe("ReportsReturnLink", () => {
  it("no renderiza si no se llegó desde /reports", () => {
    renderWithTheme(<ReportsReturnLink />, { route: ["/dashboard"] });
    expect(
      screen.queryByRole("link", { name: "Volver a reportes" }),
    ).not.toBeInTheDocument();
  });

  it("vuelve al hub cuando location.state.from es /reports", () => {
    renderWithTheme(<ReportsReturnLink />, {
      route: [{ pathname: "/dashboard", state: { from: "/reports" } }],
    });
    expect(screen.getByRole("link", { name: "Volver a reportes" })).toHaveAttribute(
      "href",
      "/reports",
    );
  });
});
