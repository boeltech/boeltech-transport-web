import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AgreementsLegacyRedirect } from "./AgreementsLegacyRedirect";

function renderRedirect(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/finance/agreements" element={<AgreementsLegacyRedirect />} />
        <Route path="/finance/compensation/templates" element={<div>templates-hub</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AgreementsLegacyRedirect", () => {
  it("redirige /finance/agreements a plantillas", () => {
    renderRedirect("/finance/agreements");
    expect(screen.getByText("templates-hub")).toBeInTheDocument();
  });
});
