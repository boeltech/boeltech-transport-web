import { fireEvent, render, screen } from "@testing-library/react";
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
});
