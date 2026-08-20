import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TripEditRedirect } from "./TripEditRedirect";

describe("TripEditRedirect", () => {
  it("sends /trips/:id/edit to the trip detail", () => {
    render(
      <MemoryRouter initialEntries={["/trips/trip-1/edit"]}>
        <Routes>
          <Route path="/trips/:id/edit" element={<TripEditRedirect />} />
          <Route path="/trips/:id" element={<div>detail:trip-1</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("detail:trip-1")).toBeInTheDocument();
  });

  it("sends /trips/:id/edit without id to the list", () => {
    render(
      <MemoryRouter initialEntries={["/trips/edit"]}>
        <Routes>
          <Route path="/trips/edit" element={<TripEditRedirect />} />
          <Route path="/trips" element={<div>list</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("list")).toBeInTheDocument();
  });
});
