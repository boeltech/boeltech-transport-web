import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { userActivityPageCopy } from "../copy/userActivityPageCopy";
import { UserActivityFilters } from "./UserActivityFilters";

const filterCopy = userActivityPageCopy.filters;

function renderFilters(
  overrides: Partial<ComponentProps<typeof UserActivityFilters>> = {},
) {
  return render(
    <UserActivityFilters
      action=""
      subjectUserId=""
      actorUserId=""
      directory={[{ value: "u1", label: "Séneca Estoico" }]}
      activePanelFilterCount={0}
      onActionChange={vi.fn()}
      onSubjectChange={vi.fn()}
      onActorChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("UserActivityFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.actionLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.actorLabel)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes", () => {
    renderFilters({
      action: "user_created",
      subjectUserId: "u1",
      actorUserId: "u1",
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(filterCopy.actionLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.personLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.actorLabel)).toBeInTheDocument();
    expect(screen.getByText("Alta de usuario")).toBeInTheDocument();
    expect(screen.getAllByText("Séneca Estoico").length).toBeGreaterThanOrEqual(1);
  });
});
