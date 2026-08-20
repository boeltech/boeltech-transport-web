import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { CreateTrailerPage } from "./CreateTrailerPage";
import { EditTrailerPage } from "./EditTrailerPage";
import { TrailerDetailPage } from "./TrailerDetailPage";
import {
  TRAILER_CATALOG_CREATE_PARAM,
  TRAILER_CATALOG_EDIT_PARAM,
} from "../trailerCatalogSheetParams";

function ListProbe() {
  const [params] = useSearchParams();
  return (
    <div>
      {`list:create=${params.get(TRAILER_CATALOG_CREATE_PARAM) ?? ""}:edit=${params.get(TRAILER_CATALOG_EDIT_PARAM) ?? ""}`}
    </div>
  );
}

describe("trailer catalog route redirects (D7-list)", () => {
  it("sends /trailers/new to the list with create=true", () => {
    render(
      <MemoryRouter initialEntries={["/trailers/new"]}>
        <Routes>
          <Route path="/trailers/new" element={<CreateTrailerPage />} />
          <Route path="/trailers" element={<ListProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("list:create=true:edit=")).toBeInTheDocument();
  });

  it("sends /trailers/:id/edit to the list with edit=<id>", () => {
    render(
      <MemoryRouter initialEntries={["/trailers/trailer-1/edit"]}>
        <Routes>
          <Route path="/trailers/:id/edit" element={<EditTrailerPage />} />
          <Route path="/trailers" element={<ListProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("list:create=:edit=trailer-1"),
    ).toBeInTheDocument();
  });

  it("sends /trailers/:id to the list without opening edit", () => {
    render(
      <MemoryRouter initialEntries={["/trailers/trailer-1"]}>
        <Routes>
          <Route path="/trailers/:id" element={<TrailerDetailPage />} />
          <Route path="/trailers" element={<ListProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("list:create=:edit=")).toBeInTheDocument();
  });

  it("sends /trailers/:id?edit=true to the list with edit=<id>", () => {
    render(
      <MemoryRouter initialEntries={["/trailers/trailer-1?edit=true"]}>
        <Routes>
          <Route path="/trailers/:id" element={<TrailerDetailPage />} />
          <Route path="/trailers" element={<ListProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("list:create=:edit=trailer-1"),
    ).toBeInTheDocument();
  });
});
