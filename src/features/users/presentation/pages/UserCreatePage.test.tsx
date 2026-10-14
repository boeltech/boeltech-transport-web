import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserCreatePage } from "./UserCreatePage";
import { usersCreatePath } from "../utils/userWayfinding";

describe("UserCreatePage (D10)", () => {
  it("redirige a /users?create=1 (Sheet en listado, no FormPageShell)", () => {
    render(
      <MemoryRouter initialEntries={["/users/new"]}>
        <Routes>
          <Route path="/users/new" element={<UserCreatePage />} />
          <Route
            path="/users"
            element={<div data-testid="users-list">Lista</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("users-list")).toBeInTheDocument();
    expect(usersCreatePath()).toBe("/users?create=1");
  });
});
