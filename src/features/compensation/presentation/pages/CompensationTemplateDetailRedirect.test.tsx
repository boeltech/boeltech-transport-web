import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CompensationTemplateDetailRedirect } from "./CompensationTemplateDetailRedirect";

function renderRedirect(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/finance/compensation/templates/:id"
          element={<CompensationTemplateDetailRedirect />}
        />
        <Route
          path="/finance/compensation/templates"
          element={<div data-testid="templates-list">Listado</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CompensationTemplateDetailRedirect", () => {
  it("redirige al catálogo con Sheet de operadores", async () => {
    renderRedirect("/finance/compensation/templates/tpl-1");

    expect(await screen.findByTestId("templates-list")).toBeInTheDocument();
  });

  it("redirige con assign legacy en query", async () => {
    renderRedirect("/finance/compensation/templates/tpl-1?assignEmployee=emp-1");

    expect(await screen.findByTestId("templates-list")).toBeInTheDocument();
  });
});
