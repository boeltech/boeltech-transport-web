import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { formatDate } from "@shared/utils/dateUtils";
import { BuilderHistoryPanel } from "./BuilderHistoryPanel";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";
import type { CompensationTemplate } from "../../domain/entities";

const { mockUseTemplateVersions } = vi.hoisted(() => ({
  mockUseTemplateVersions: vi.fn(),
}));

vi.mock("../../application/hooks", () => ({
  useTemplateVersions: (...args: unknown[]) => mockUseTemplateVersions(...args),
  useTemplateActivity: () => ({ data: { data: [] }, isLoading: false }),
}));

function makeVersion(overrides: Partial<CompensationTemplate> & Pick<CompensationTemplate, "id">) {
  return makeCompensationTemplate({ name: "Operador foráneo", ...overrides });
}

const current = makeVersion({ id: "tpl-v3", version: 3, status: "active" });

function versionRow(version: number): HTMLElement {
  return screen.getByText(`v${version}`).closest("li") as HTMLElement;
}

function renderPanel(versions: CompensationTemplate[]) {
  mockUseTemplateVersions.mockReturnValue({ data: versions, isLoading: false });
  return render(
    <MemoryRouter>
      <BuilderHistoryPanel template={current} />
    </MemoryRouter>,
  );
}

describe("BuilderHistoryPanel ? fecha de reemplazo/desactivación (W5)", () => {
  beforeEach(() => {
    mockUseTemplateVersions.mockReset();
  });

  it("criterio 10: reemplazada muestra «Reemplazada el {fecha}» sin la línea «Inactiva»", () => {
    const inactivatedAt = "2026-10-01T15:00:00Z";
    renderPanel([
      current,
      makeVersion({
        id: "tpl-v2",
        version: 2,
        status: "inactive",
        inactiveReason: "superseded",
        inactivatedAt,
      }),
    ]);

    const row = versionRow(2);
    expect(within(row).getByText("Reemplazada")).toBeInTheDocument();
    expect(
      within(row).getByText(`Reemplazada el ${formatDate(inactivatedAt)}`),
    ).toBeInTheDocument();
    expect(within(row).queryByText("Inactiva")).not.toBeInTheDocument();
  });

  it("criterio 10: desactivada muestra «Desactivada el {fecha}»", () => {
    const inactivatedAt = "2026-09-15T18:30:00Z";
    renderPanel([
      current,
      makeVersion({
        id: "tpl-v1",
        version: 1,
        status: "inactive",
        inactiveReason: "manual",
        inactivatedAt,
      }),
    ]);

    const row = versionRow(1);
    expect(
      within(row).getByText(`Desactivada el ${formatDate(inactivatedAt)}`),
    ).toBeInTheDocument();
    expect(within(row).queryByText("Inactiva")).not.toBeInTheDocument();
  });

  it("sin inactivated_at no inventa fecha ni repite el estado", () => {
    renderPanel([
      current,
      makeVersion({
        id: "tpl-v2",
        version: 2,
        status: "inactive",
        inactiveReason: "superseded",
      }),
    ]);

    const row = versionRow(2);
    expect(within(row).getByText("Reemplazada")).toBeInTheDocument();
    expect(within(row).queryByText(/Reemplazada el/)).not.toBeInTheDocument();
    expect(within(row).queryByText("Inactiva")).not.toBeInTheDocument();
  });

  it("sin inactive_reason (API anterior) conserva la línea de estado de hoy", () => {
    renderPanel([current, makeVersion({ id: "tpl-v2", version: 2, status: "inactive" })]);

    const row = versionRow(2);
    expect(within(row).getAllByText("Inactiva")).toHaveLength(2);
    expect(within(row).queryByText(/Reemplazada|Desactivada/)).not.toBeInTheDocument();
  });
});
