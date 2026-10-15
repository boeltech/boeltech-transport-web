import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { EntityListCard } from "./EntityListCard";
import { entityListCardMenuTriggerClassName } from "./entityListCardMenuTrigger";

describe("EntityListCard", () => {
  it("expone className de menú usable sin hover", () => {
    expect(entityListCardMenuTriggerClassName).toMatch(/opacity-100/);
    expect(entityListCardMenuTriggerClassName).toMatch(
      /@media\(hover:hover\)/,
    );
  });

  it("renderiza children y propaga click", () => {
    const onClick = vi.fn();
    render(
      <EntityListCard onClick={onClick}>
        <span>Unidad 01</span>
      </EntityListCard>,
    );

    fireEvent.click(screen.getByText("Unidad 01"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("con to expone un enlace navegable", () => {
    render(
      <MemoryRouter>
        <EntityListCard to="/settings/catalogs/c_ClaveProdServ">
          <span>Producto/servicio</span>
        </EntityListCard>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /Producto\/servicio/i }),
    ).toHaveAttribute("href", "/settings/catalogs/c_ClaveProdServ");
  });

  it("con onClick responde a Enter como enlace", () => {
    const onClick = vi.fn();
    render(
      <EntityListCard onClick={onClick}>
        <span>Unidad 02</span>
      </EntityListCard>,
    );

    const card = screen.getByRole("link");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
