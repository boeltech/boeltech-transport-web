import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TemplateCompositionCard } from "./TemplateCompositionCard";
import type { CompensationTemplate } from "../../domain/entities";

vi.mock("../../application/hooks", () => ({
  useDeleteCompensationTemplate: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => false,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const baseTemplate: CompensationTemplate = {
  id: "tpl-1",
  name: "Operador foráneo",
  description: "Esquema estándar para rutas largas",
  isActive: true,
  rules: [
    {
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 4.5,
      minimumGuaranteedAmount: 0,
    },
  ],
  fixedAllowances: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
};

function renderCard(
  template: CompensationTemplate = baseTemplate,
  options?: { isExpanded?: boolean },
) {
  const onToggleExpand = vi.fn();
  render(
    <MemoryRouter>
      <TemplateCompositionCard
        template={template}
        isExpanded={options?.isExpanded ?? false}
        onToggleExpand={onToggleExpand}
      />
    </MemoryRouter>,
  );
  return { onToggleExpand };
}

describe("TemplateCompositionCard", () => {
  it("renders collapsed summary with metrics", () => {
    renderCard();

    expect(screen.getByText("Operador foráneo")).toBeInTheDocument();
    expect(screen.getByText("Esquema estándar para rutas largas")).toBeInTheDocument();
    expect(screen.getByText("reglas")).toBeInTheDocument();
    expect(screen.getByText(/Cuando viaje foráneo/i)).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("shows incomplete badge when template has no rules or corridors", () => {
    renderCard({
      ...baseTemplate,
      name: "Borrador",
      rules: [],
    });

    expect(screen.getByText("Falta reglas o rutas")).toBeInTheDocument();
  });

  it("expands panel with aria attributes when toggled", async () => {
    const user = userEvent.setup();
    const { onToggleExpand } = renderCard(baseTemplate, { isExpanded: false });

    const toggle = screen.getByRole("button", {
      name: /Expandir esquema Operador foráneo/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it("renders expanded composition panel", () => {
    renderCard(baseTemplate, { isExpanded: true });

    const toggle = screen.getByRole("button", {
      name: /Contraer esquema Operador foráneo/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", {
        name: /Composición del esquema Operador foráneo/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Composición")).toBeInTheDocument();
    expect(screen.getByText("Rutas vinculadas")).toBeInTheDocument();
    expect(screen.getByLabelText("Reglas por ruta")).toBeInTheDocument();
  });
});
