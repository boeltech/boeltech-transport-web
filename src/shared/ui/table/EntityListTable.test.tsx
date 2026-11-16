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

  describe("filas de grupo", () => {
    const groupedRows: DemoRow[] = [
      { ...rows[0], id: "a1", name: "A-1", branch: "Norte", amount: 100 },
      { ...rows[0], id: "a2", name: "A-2", branch: "Norte", amount: 200 },
      { ...rows[0], id: "b1", name: "B-1", branch: "Sur", amount: 50 },
    ];

    function renderGrouped(props: Partial<EntityListTableProps<DemoRow>> = {}) {
      return renderTable({
        rows: groupedRows,
        getGroupKey: (r) => r.branch ?? "",
        renderGroupHeader: (group) => ({
          title: group.key,
          meta: `${group.rows.length} filas`,
          cells: {
            amount: group.rows.reduce((sum, r) => sum + (r.amount ?? 0), 0),
            actions: <button type="button">Lote {group.key}</button>,
          },
        }),
        ...props,
      });
    }

    it("una fila de grupo por corrida consecutiva, antes de sus filas", () => {
      const { container } = renderGrouped();
      const bodyRows = Array.from(container.querySelectorAll("tbody tr"));
      expect(bodyRows.map((r) => r.hasAttribute("data-entity-group-row"))).toEqual(
        [true, false, false, true, false],
      );
      expect(bodyRows[0]).toHaveTextContent("Norte · 2 filas");
      expect(container.querySelectorAll("thead")).toHaveLength(1);
    });

    it("label abarca hasta la primera columna con celda; celdas alineadas por kind", () => {
      const { container } = renderGrouped();
      const groupRow = container.querySelector("tr[data-entity-group-row]")!;
      const cells = within(groupRow as HTMLElement).getAllByRole("cell");
      // name, branch, plate, km → label (colSpan 4); amount; actions
      expect(cells[0]).toHaveAttribute("colspan", "4");
      expect(cells).toHaveLength(3);
      expect(cells[1]).toHaveTextContent("$300.00");
      expect(cells[1]!.className).toContain("text-right");
      expect(cells[1]!.className).toContain("font-mono");
      expect(
        within(cells[2]!).getByRole("button", { name: "Lote Norte" }),
      ).toBeInTheDocument();
    });

    it("fila de grupo sin hover ni click de fila", async () => {
      const user = userEvent.setup();
      const onRowActivate = vi.fn();
      const { container } = renderGrouped({
        primaryTo: undefined,
        onRowActivate,
      });
      const groupRow = container.querySelector(
        "tr[data-entity-group-row]",
      ) as HTMLElement;
      expect(groupRow.className).toContain("hover:bg-muted/60");
      expect(groupRow.className).not.toContain("cursor-pointer");
      await user.click(groupRow);
      expect(onRowActivate).not.toHaveBeenCalled();
    });

    it("las filas de grupo cuentan para el sticky header (> 25)", () => {
      const many: DemoRow[] = Array.from({ length: 20 }, (_, i) => ({
        ...rows[0],
        id: `r${i}`,
        branch: `G${Math.floor(i / 7)}`,
      }));
      const { container: grouped } = renderGrouped({ rows: many });
      // 20 filas + 3 grupos = 23 → sin sticky
      expect(grouped.querySelector("thead")!.className).not.toContain("sticky");

      const many2: DemoRow[] = Array.from({ length: 20 }, (_, i) => ({
        ...rows[0],
        id: `s${i}`,
        branch: `G${Math.floor(i / 2)}`,
      }));
      const { container: grouped2 } = renderGrouped({ rows: many2 });
      // 20 filas + 10 grupos = 30 → sticky
      expect(grouped2.querySelector("thead")!.className).toContain("sticky");
    });

    it("sin getGroupKey el render no cambia (sin filas de grupo)", () => {
      const { container } = renderTable({ rows: groupedRows });
      expect(container.querySelector("tr[data-entity-group-row]")).toBeNull();
      expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    });
  });

  it("stacked: stackedWeight normal quita font-medium de la línea 1", () => {
    const columns: EntityListColumnDef<DemoRow>[] = [
      {
        id: "s",
        header: "S",
        kind: "stacked",
        stackedWeight: "normal",
        accessor: () => ({ primary: "Monto", secondary: "L2" }),
      },
      {
        id: "d",
        header: "D",
        kind: "stacked",
        accessor: () => ({ primary: "Default", secondary: "L2" }),
      },
    ];
    renderTable({ columns, rows: [rows[0]] });
    expect(screen.getByText("Monto").className).toContain("font-normal");
    expect(screen.getByText("Monto").className).not.toContain("font-medium");
    expect(screen.getByText("Default").className).toContain("font-medium");
  });

  it("framed default envuelve en card Operate", () => {
    const { container } = renderTable({ rows: [rows[0]] });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("rounded-xl");
    expect(root.className).toContain("bg-card");
  });

  describe("kind share + summaryRow", () => {
    type ShareRow = {
      id: string;
      name: string;
      share: { amount: number; percent: number } | null;
    };

    const shareColumns: EntityListColumnDef<ShareRow>[] = [
      {
        id: "name",
        header: "Cliente",
        kind: "text",
        accessor: (r) => r.name,
      },
      {
        id: "share",
        header: "Parte del flete",
        kind: "share",
        accessor: (r) => r.share,
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: () => null,
      },
    ];

    const shareRows: ShareRow[] = [
      { id: "1", name: "Cliente A", share: { amount: 6000, percent: 60 } },
      { id: "2", name: "Cliente B", share: { amount: 4000, percent: 40 } },
      { id: "3", name: "Sin dato", share: null },
    ];

    function renderShareTable(
      props: Partial<EntityListTableProps<ShareRow>> = {},
    ) {
      return render(
        <MemoryRouter>
          <EntityListTable
            columns={shareColumns}
            rows={shareRows}
            getRowId={(r) => r.id}
            {...props}
          />
        </MemoryRouter>,
      );
    }

    it("share: monto + % visibles; barra aria-hidden; vacío → —", () => {
      const { container } = renderShareTable();
      expect(screen.getByText("$6,000.00")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
      // % legible; Progress con aria-hidden no expone role progressbar
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThan(
        0,
      );
    });

    it("summaryRow al final en tfoot; sin hover activable; formatea share", async () => {
      const user = userEvent.setup();
      const onRowActivate = vi.fn();
      const { container } = renderShareTable({
        onRowActivate,
        summaryRow: {
          label: "Base de flete",
          cells: {
            share: { amount: 10_000, percent: 100 },
          },
        },
      });

      const summary = container.querySelector(
        "tr[data-entity-summary-row]",
      ) as HTMLElement;
      expect(summary).toBeTruthy();
      expect(summary.closest("tfoot")).toBeTruthy();
      expect(summary).toHaveTextContent("Base de flete");
      expect(summary).toHaveTextContent("$10,000.00");
      expect(summary).toHaveTextContent("100%");
      expect(summary.className).toContain("bg-muted/60");
      expect(summary.className).not.toContain("cursor-pointer");

      await user.click(summary);
      expect(onRowActivate).not.toHaveBeenCalled();
    });

    it("summaryRow no se muestra en loading", () => {
      const { container } = renderShareTable({
        rows: [],
        isLoading: true,
        summaryRow: {
          label: "Base de flete",
          cells: { share: { amount: 1, percent: 100 } },
        },
      });
      expect(container.querySelector("tr[data-entity-summary-row]")).toBeNull();
    });
  });
});
