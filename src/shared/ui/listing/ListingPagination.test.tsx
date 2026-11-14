import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingPagination } from "./ListingPagination";

describe("ListingPagination", () => {
  it("no renderiza Primera ni Última", () => {
    render(
      <ListingPagination page={2} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(screen.queryByRole("button", { name: "Primera" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Última" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });

  it('página actual usa variant="secondary" (no default/primary sólida)', () => {
    render(
      <ListingPagination page={3} totalPages={5} onPageChange={vi.fn()} />,
    );

    const current = screen.getByRole("button", { name: "3" });
    expect(current.className).toMatch(/bg-secondary/);
    expect(current.className).not.toMatch(/bg-primary/);
  });

  it("embedded omite border-t propio", () => {
    const { container } = render(
      <ListingPagination
        page={1}
        totalPages={3}
        onPageChange={vi.fn()}
        embedded
      />,
    );

    expect(container.firstChild).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).not.toContain(
      "border-t",
    );
  });

  it("llama onPageChange desde Anterior / número / Siguiente", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <ListingPagination page={2} totalPages={4} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("totalPages <= 1 → null", () => {
    const { container } = render(
      <ListingPagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
