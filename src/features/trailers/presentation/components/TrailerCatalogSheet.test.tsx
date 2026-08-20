import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrailerCatalogSheet } from "./TrailerCatalogSheet";
import { trailersCopy } from "../copy/trailersCopy";
import { TrailerStatus, type Trailer } from "../../domain";

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("../../application", () => ({
  useCreateTrailer: () => ({
    mutate: createMutate,
    isPending: false,
  }),
  useUpdateTrailer: () => ({
    mutate: updateMutate,
    isPending: false,
  }),
}));

vi.mock("@features/catalogs", () => ({
  SubTipoRemSelect: ({
    triggerId,
    value,
    onValueChange,
  }: {
    triggerId?: string;
    value?: string;
    onValueChange: (value: string) => void;
  }) => (
    <input
      id={triggerId}
      aria-label={trailersCopy.form.label.satSubTipoRemCode}
      value={value ?? ""}
      onChange={(event) => onValueChange(event.target.value)}
    />
  ),
}));

const trailer: Trailer = {
  id: "trailer-1",
  tenantId: "tenant-1",
  licensePlate: "REM1234",
  satSubTipoRemCode: "CTR001",
  status: TrailerStatus.AVAILABLE,
  branchId: null,
  isActive: true,
  notes: "Patio norte",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  createdBy: null,
  updatedBy: null,
};

describe("TrailerCatalogSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows create copy and does not navigate on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<TrailerCatalogSheet open onOpenChange={onOpenChange} />);

    expect(
      screen.getByRole("heading", {
        name: trailersCopy.catalogSheet.createTitle,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(trailersCopy.catalogSheet.createDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(trailersCopy.form.placeholder.licensePlate),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(trailersCopy.form.placeholder.notes),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: trailersCopy.form.cancel }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits create payload with branchId null", async () => {
    const user = userEvent.setup();

    render(<TrailerCatalogSheet open onOpenChange={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(trailersCopy.form.placeholder.licensePlate),
      "ABC1234",
    );
    await user.type(
      screen.getByLabelText(trailersCopy.form.label.satSubTipoRemCode),
      "CTR001",
    );
    await user.click(
      screen.getByRole("button", { name: trailersCopy.form.submitCreate }),
    );

    expect(createMutate).toHaveBeenCalledWith({
      licensePlate: "ABC1234",
      satSubTipoRemCode: "CTR001",
      notes: null,
      branchId: null,
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("submits edit payload preserving branchId", async () => {
    const user = userEvent.setup();

    render(
      <TrailerCatalogSheet
        open
        onOpenChange={vi.fn()}
        trailer={{ ...trailer, branchId: "branch-1" }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: trailersCopy.catalogSheet.editTitle,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: trailersCopy.form.submitEdit }),
    );

    expect(updateMutate).toHaveBeenCalledWith({
      id: "trailer-1",
      data: {
        licensePlate: "REM1234",
        satSubTipoRemCode: "CTR001",
        notes: "Patio norte",
        branchId: "branch-1",
      },
    });
    expect(createMutate).not.toHaveBeenCalled();
  });
});
