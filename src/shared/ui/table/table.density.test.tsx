import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

function renderSample(density?: "list" | "compact") {
  return render(
    <Table density={density}>
      <TableHeader>
        <TableRow>
          <TableHead>Unidad</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>ABC-123</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

describe("Table density opt-in", () => {
  it("sin density conserva clases legado", () => {
    renderSample();

    const head = screen.getByRole("columnheader", { name: "Unidad" });
    const cell = screen.getByRole("cell", { name: "ABC-123" });
    const row = cell.closest("tr");

    expect(head.className).toContain("h-10");
    expect(head.className).toContain("px-2");
    expect(head.className).not.toContain("h-9");
    expect(head.className).not.toContain("bg-muted");
    expect(head.className).not.toContain("first:pl-4");

    expect(cell.className).toContain("p-2");
    expect(cell.className).not.toContain("h-11");
    expect(cell.className).not.toContain("h-9");
    expect(cell.className).not.toContain("px-3");

    expect(row?.className).toContain("hover:bg-muted/50");
    expect(row?.className).toContain("data-[state=selected]:bg-muted");
    expect(row?.className).not.toContain("bg-primary-50");
  });

  it('density="list" aplica Anatomía (head 36, cell 44, selected primary-50)', () => {
    renderSample("list");

    const head = screen.getByRole("columnheader", { name: "Unidad" });
    const cell = screen.getByRole("cell", { name: "ABC-123" });
    const row = cell.closest("tr");

    expect(head.className).toContain("h-9");
    expect(head.className).toContain("text-xs");
    expect(head.className).toContain("bg-muted");
    expect(head.className).toContain("px-3");
    expect(head.className).toContain("first:pl-4");

    expect(cell.className).toContain("h-11");
    expect(cell.className).toContain("text-sm");
    expect(cell.className).toContain("px-3");
    expect(cell.className).toContain("first:pl-4");

    expect(row?.className).toContain("hover:bg-muted");
    expect(row?.className).toContain("data-[state=selected]:bg-primary-50");
    expect(row?.className).not.toContain("hover:bg-muted/50");
  });

  it('density="compact" usa cell h-9; head igual al list', () => {
    renderSample("compact");

    const head = screen.getByRole("columnheader", { name: "Unidad" });
    const cell = screen.getByRole("cell", { name: "ABC-123" });

    expect(head.className).toContain("h-9");
    expect(head.className).toContain("bg-muted");
    expect(cell.className).toContain("h-9");
    expect(cell.className).toContain("text-sm");
    expect(cell.className).not.toContain("h-11");
  });

  it("prop density en pieza gana sobre context del Table", () => {
    render(
      <Table density="list">
        <TableBody>
          <TableRow>
            <TableCell density="compact">Override</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const cell = screen.getByRole("cell", { name: "Override" });
    expect(cell.className).toContain("h-9");
    expect(cell.className).not.toContain("h-11");
  });
});
