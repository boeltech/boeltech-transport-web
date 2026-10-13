import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Truck, Settings } from "lucide-react";
import {
  LongFormEditLayout,
  LongFormSectionNav,
} from "./LongFormSectionNav";

const sections = [
  { id: "a", label: "Identificación", icon: Truck },
  { id: "b", label: "Características", icon: Settings },
];

describe("LongFormSectionNav", () => {
  it("salta de sección al clic y marca errores", () => {
    const onSelect = vi.fn();
    render(
      <LongFormSectionNav
        sections={sections}
        activeSectionId="a"
        errorCountBySection={{ b: 2 }}
        onSelectSection={onSelect}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Características/i }),
    );
    expect(onSelect).toHaveBeenCalledWith("b");

    expect(screen.getByLabelText("2 errores")).toBeInTheDocument();
    expect(screen.getByLabelText("2 errores")).toHaveAttribute(
      "title",
      "2 errores en Características",
    );
  });

  it("LongFormEditLayout monta rail + contenido", () => {
    render(
      <LongFormEditLayout
        nav={<nav aria-label="Secciones">Rail</nav>}
      >
        <section>Canvas</section>
      </LongFormEditLayout>,
    );

    expect(screen.getByLabelText("Secciones")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
  });
});
