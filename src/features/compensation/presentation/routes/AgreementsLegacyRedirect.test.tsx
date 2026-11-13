import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { COMPENSATION_TEMPLATES_PATH } from "../../application/compensationRoutes";
import { AgreementsLegacyRedirect } from "./AgreementsLegacyRedirect";

function renderRedirect(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/finance/agreements" element={<AgreementsLegacyRedirect />} />
        <Route path={COMPENSATION_TEMPLATES_PATH} element={<div>tariffs-hub</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AgreementsLegacyRedirect", () => {
  it("redirige /finance/agreements a Tarifas (operator-payments)", () => {
    renderRedirect("/finance/agreements");
    expect(screen.getByText("tariffs-hub")).toBeInTheDocument();
  });
});
