import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { SettlementsLegacyRedirect } from "./SettlementsLegacyRedirect";

function renderRedirect(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/settlements/new" element={<SettlementsLegacyRedirect />} />
        <Route path="/settlements/:id" element={<SettlementsLegacyRedirect />} />
        <Route path="/settlements" element={<SettlementsLegacyRedirect />} />
        <Route path="/finance/settlements" element={<div>list</div>} />
        <Route path="/finance/settlements/new" element={<div>create</div>} />
        <Route path="/finance/settlements/:id" element={<div>detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SettlementsLegacyRedirect", () => {
  it("redirects legacy list to canonical list", () => {
    renderRedirect("/settlements");
    expect(screen.getByText("list")).toBeInTheDocument();
  });

  it("redirects legacy create with query to canonical create", () => {
    renderRedirect("/settlements/new?employeeId=emp-1");
    expect(screen.getByText("create")).toBeInTheDocument();
  });

  it("redirects legacy detail to canonical detail", () => {
    renderRedirect("/settlements/settlement-123");
    expect(screen.getByText("detail")).toBeInTheDocument();
  });
});
