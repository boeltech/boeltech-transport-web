import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListTableProps,
} from "./EntityListTable";

type DemoRow = {
  id: string;
  name: string | null;
  branch: string | null;
  plate: string | null;
  km: number | null;
  amount: number | null;
};

const rows: DemoRow[] = [
  {
    id: "1",
    name: "Unidad 12",
    branch: "Centro",
    plate: "ABC-123",
    km: 1500,
    amount: 1250.5,
  },
  {
    id: "2",
    name: null,
    branch: "",
    plate: null,
    km: null,
    amount: null,
  },
];

const baseColumns: EntityListColumnDef<DemoRow>[] = [
  {
    id: "name",
    header: "Unidad",
    kind: "primary",
    accessor: (r) => r.name,
    sortable: true,
    sortField: "unit_number",
  },
  {
    id: "branch",
    header: "Sucursal",
    kind: "meta",
    accessor: (r) => r.branch,
  },
  {
    id: "plate",
    header: "Placa",
    kind: "code",
    accessor: (r) => r.plate,
  },
  {
    id: "km",
    header: "Kilometraje (km)",
    kind: "number",
    accessor: (r) => r.km,
    sortable: true,
    sortField: "mileage",
  },
  {
    id: "amount",
    header: "Monto (MXN)",
    kind: "money",
    accessor: (r) => r.amount,
  },
  {
    id: "actions",
    header: "",
    kind: "actions",
    accessor: () => (
      <button type="button" aria-label="Acciones">
        ⋯
      </button>
    ),
  },
];

function renderTable(props: Partial<EntityListTableProps<DemoRow>> = {}) {
  return render(
    <MemoryRouter>
      <EntityListTable
        columns={baseColumns}
        rows={rows}
        getRowId={(r) => r.id}
        primaryTo={(r) => `/vehicles/${r.id}`}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("EntityListTable", () => {
  it("empty sin loading → null (shell posee empty)", () => {
    const { container } = renderTable({ rows: [], isLoading: false });
    expect(container.firstChild).toBeNull();
  });

  it("celdas vacías muestran «—» muted; actions no", () => {
    renderTable({ rows: [rows[1]] });

    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
    dashes.forEach((el) => {
      expect(el.className).toContain("text-muted-foreground");
    });

    expect(screen.getByRole("button", { name: "Acciones" })).toBeInTheDocument();
  });

  it("primary es Link real; click en fila (fuera de interactive) lo activa", async () => {
    const user = userEvent.setup();
    renderTable({ rows: [rows[0]] });

    const link = screen.getByRole("link", { name: "Unidad 12" });
    expect(link).toHaveAttribute("href", "/vehicles/1");

    const clickSpy = vi.spyOn(link, "click");
    const row = link.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row!);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("primary + stacked: link solo en la línea principal; secondary muted", () => {
    const columns: EntityListColumnDef<DemoRow>[] = [
      {
        id: "name",
        header: "Unidad",
        kind: "primary",
        accessor: (r) => ({
          primary: r.name,
          secondary: "Tractocamión",
        }),
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: () => (
          <button type="button" aria-label="Acciones">
            ⋯
          </button>
        ),
      },
    ];

    renderTable({
      columns,
      rows: [rows[0]],
      primaryState: () => ({ from: "/vehicles?sortBy=unit_number" }),
    });

    const link = screen.getByRole("link", { name: "Unidad 12" });
    expect(link).toHaveAttribute("href", "/vehicles/1");
    expect(screen.getByText("Tractocamión")).toBeInTheDocument();
    expect(screen.getByText("Tractocamión").tagName).toBe("DIV");
  });

  it("click en actions no dispara el link primario", async () => {
    const user = userEvent.setup();
    renderTable({ rows: [rows[0]] });

    const link = screen.getByRole("link", { name: "Unidad 12" });
    const clickSpy = vi.spyOn(link, "click");
    await user.click(screen.getByRole("button", { name: "Acciones" }));
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("sort headers exponen aria-sort y llaman onSortChange", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const sort: EntityListSortState = {
      field: "unit_number",
      direction: "asc",
    };

    renderTable({ sort, onSortChange });

    const unitHeader = screen.getByRole("columnheader", { name: /Unidad/i });
    expect(unitHeader).toHaveAttribute("aria-sort", "ascending");

    const mileageHeader = screen.getByRole("columnheader", {
      name: /Kilometraje/i,
    });
    expect(mileageHeader).toHaveAttribute("aria-sort", "none");

    await user.click(within(unitHeader).getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith({
      field: "unit_number",
      direction: "desc",
    });

    await user.click(within(mileageHeader).getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith({
      field: "mileage",
      direction: "asc",
    });
  });

  it('siempre pasa density a Table (default "list")', () => {
    renderTable({ rows: [rows[0]] });

    const head = screen.getByRole("columnheader", { name: /Unidad/i });
    const cell = screen.getByRole("cell", { name: "Unidad 12" });

    expect(head.className).toContain("h-9");
    expect(head.className).toContain("bg-muted");
    expect(cell.className).toContain("h-11");
  });

  it('density="compact" usa celdas h-9', () => {
    renderTable({ rows: [rows[0]], density: "compact" });
    const cell = screen.getByRole("cell", { name: "Unidad 12" });
    expect(cell.className).toContain("h-9");
    expect(cell.className).not.toContain("h-11");
  });

  it("loading muestra skeleton por columns dentro de la card", () => {
    const { container } = renderTable({ rows: [], isLoading: true });
    expect(container.querySelector(".rounded-xl")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /Unidad/i })).toBeInTheDocument();
    // 5 skeleton rows × N columns → varios animate-pulse
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      5,
    );
  });

  it("footer slot se renderiza bajo la tabla con border-t", () => {
    renderTable({
      rows: [rows[0]],
      footer: <span>Mostrando 1–10</span>,
    });
    expect(screen.getByText("Mostrando 1–10")).toBeInTheDocument();
  });

  it("framed=false no aplica card en el wrapper exterior", () => {
    const { container } = renderTable({ rows: [rows[0]], framed: false });
    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.className).not.toContain("rounded-xl");
    expect(root.className).not.toContain("bg-card");
    expect(root.className).not.toContain("shadow-sm");
  });

  it("framed default envuelve en card Operate", () => {
    const { container } = renderTable({ rows: [rows[0]] });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("rounded-xl");
    expect(root.className).toContain("bg-card");
  });
});
