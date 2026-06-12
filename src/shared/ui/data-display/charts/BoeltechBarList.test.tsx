import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoeltechBarList } from "@shared/ui/data-display";

describe("BoeltechBarList", () => {
  it("renders items sorted descending by value", () => {
    render(
      <BoeltechBarList
        items={[
          { key: "a", label: "Cliente A", value: 100 },
          { key: "b", label: "Cliente B", value: 300 },
          { key: "c", label: "Cliente C", value: 200 },
        ]}
        valueFormatter={(n) => `$${n}`}
        aria-label="Top clientes"
      />,
    );

    const list = screen.getByRole("list", { name: "Top clientes" });
    const labels = Array.from(list.querySelectorAll("span.font-medium")).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(["Cliente B", "Cliente C", "Cliente A"]);
    expect(screen.getByText("$300")).toBeInTheDocument();
  });

  it("shows empty state when there are no items", () => {
    render(<BoeltechBarList items={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sin datos para ranking.",
    );
  });

  it("calls onItemClick with item key", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(
      <BoeltechBarList
        items={[{ key: "unit-1", label: "Unidad 1", value: 500 }]}
        onItemClick={onItemClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Unidad 1/i }));
    expect(onItemClick).toHaveBeenCalledWith("unit-1");
  });
});
