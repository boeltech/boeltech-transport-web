import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FinanceDispatchPage } from "./FinanceDispatchPage";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const mockHasPermission = vi.fn();
const mockUseDispatchDocuments = vi.fn();
const mockUseBillingDispatchRuns = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@features/invoicing/application", () => ({
  useDispatchDocuments: (...args: unknown[]) =>
    mockUseDispatchDocuments(...args),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useBillingDispatchRuns: (...args: unknown[]) =>
      mockUseBillingDispatchRuns(...args),
  };
});

vi.mock("../components/FinanceDispatchPendingPanel", () => ({
  FinanceDispatchPendingPanel: () => (
    <div data-testid="dispatch-pending-panel" />
  ),
}));

vi.mock("../components/FinanceDispatchSentPanel", () => ({
  FinanceDispatchSentPanel: () => <div data-testid="dispatch-sent-panel" />,
}));

vi.mock("../components/FinanceDispatchConfirmSheet", () => ({
  FinanceDispatchConfirmSheet: () => null,
}));

vi.mock("../components/FinanceDispatchCreateRunDialog", () => ({
  FinanceDispatchCreateRunDialog: () => null,
}));

describe("FinanceDispatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && action === "execute",
    );
    mockUseDispatchDocuments.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 1, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });
    mockUseBillingDispatchRuns.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 1, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });
  });

  it("renders Envíos title and Armar as outline secondaryAction", () => {
    renderWithTheme(<FinanceDispatchPage />, {
      route: ["/finance/dispatch"],
    });

    expect(
      screen.getByRole("heading", { name: dispatchRunsCopy.workbench.title }),
    ).toBeInTheDocument();

    const arm = screen.getByRole("button", {
      name: dispatchRunsCopy.workbench.armPeriodCta,
    });
    expect(arm).toBeInTheDocument();
    expect(arm.className).toMatch(/border-input|bg-background/);
    expect(arm.className).not.toMatch(/\bbg-primary\b/);

    expect(screen.getByTestId("dispatch-pending-panel")).toBeInTheDocument();
  });

  it("loads badge totals from dispatch-documents with documentKind filter", () => {
    renderWithTheme(<FinanceDispatchPage />, {
      route: ["/finance/dispatch?document_kind=rep"],
    });

    expect(mockUseDispatchDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "pending",
        documentKind: "rep",
        page: 1,
        limit: 1,
      }),
    );
    expect(mockUseDispatchDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "sent",
        documentKind: "rep",
        page: 1,
        limit: 1,
      }),
    );
  });

  it("hides Armar without invoices.execute", () => {
    mockHasPermission.mockReturnValue(false);

    renderWithTheme(<FinanceDispatchPage />, {
      route: ["/finance/dispatch"],
    });

    expect(
      screen.queryByRole("button", {
        name: dispatchRunsCopy.workbench.armPeriodCta,
      }),
    ).not.toBeInTheDocument();
  });
});
