import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { UserStatus, type UserListItem } from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { entityListCardMenuTriggerClassName } from "@shared/ui/listing";
import { UserCard } from "./UserCard";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

const user: UserListItem = {
  id: "u-1",
  email: "ana@example.com",
  firstName: "Ana",
  lastName: "López",
  role: "manager",
  status: UserStatus.ACTIVE,
  lastLogin: "2026-10-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("UserCard (D2)", () => {
  it("expone menú ⋯ sin hover-only (EntityListCard touch)", () => {
    render(
      <MemoryRouter>
        <UserCard user={user} onView={vi.fn()} />
      </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", {
      name: usersCopy.list.card.actionsAria,
    });
    expect(trigger).toBeInTheDocument();
    // Touch: siempre visible; hover-only solo vía media query del primitivo.
    expect(trigger.className).toContain("opacity-100");
    expect(entityListCardMenuTriggerClassName).toContain(
      "[@media(hover:hover)]:opacity-0",
    );
    expect(trigger.className).not.toMatch(/^opacity-0| group-hover:opacity-100$/);
  });
});
