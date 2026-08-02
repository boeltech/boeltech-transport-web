import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { UserManagementEvent } from "../../domain";
import { UserActivityFeed } from "./UserActivityFeed";

function buildEvent(overrides: Partial<UserManagementEvent> = {}): UserManagementEvent {
  return {
    id: "event-1",
    subjectUserId: "user-2",
    actorUserId: "user-1",
    actorEmail: "ana@tlama.mx",
    actorFirstName: "Ana",
    actorLastName: "Ruiz",
    action: "status_changed",
    payload: { from: "active", to: "suspended" },
    createdAt: "2026-04-10T18:04:00.000Z",
    ...overrides,
  };
}

const NAMES = new Map([["user-2", "Luis Pérez"]]);

function renderFeed(events: UserManagementEvent[], names = NAMES) {
  return render(
    <MemoryRouter>
      <UserActivityFeed events={events} subjectNames={names} />
    </MemoryRouter>,
  );
}

describe("UserActivityFeed", () => {
  it("shows the resolved name instead of an identifier and links both profiles", () => {
    renderFeed([buildEvent()]);

    expect(screen.getByRole("link", { name: "Luis Pérez" })).toHaveAttribute(
      "href",
      "/users/user-2",
    );
    expect(screen.getByRole("link", { name: "Ana Ruiz" })).toHaveAttribute(
      "href",
      "/users/user-1",
    );
    expect(screen.queryByText(/user-2…/)).not.toBeInTheDocument();
  });

  it("groups events under a day heading with its count", () => {
    renderFeed([
      buildEvent({ id: "a" }),
      buildEvent({ id: "b", createdAt: "2026-04-10T12:00:00.000Z" }),
    ]);

    expect(screen.getByText("2 movimientos")).toBeInTheDocument();
  });

  it("does not link an account that no longer exists", () => {
    renderFeed([buildEvent()], new Map());

    expect(screen.getByText("una cuenta eliminada")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "una cuenta eliminada" }),
    ).not.toBeInTheDocument();
  });

  it("omits the subject when the account is already on screen", () => {
    render(
      <MemoryRouter>
        <UserActivityFeed
          events={[buildEvent()]}
          includeSubject={false}
          linkPeople={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Luis Pérez")).not.toBeInTheDocument();
  });
});
