import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OperatorPaymentsOperatorsPage } from "./OperatorPaymentsOperatorsPage";
import { settlementsCopy } from "../copy/settlementsCopy";
import type { OperatorPaymentReadiness } from "../../domain/entities";

const copy = settlementsCopy.operatorsList;

type PageResult = {
  data: OperatorPaymentReadiness[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const {
  mockList,
  mockPermissions,
  attentionResponses,
} = vi.hoisted(() => {
  const attentionResponses: Record<string, PageResult> = {};
  return {
    attentionResponses,
    mockList: vi.fn(),
    mockPermissions: { granted: new Set<string>() },
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockPermissions.granted.has(`${module}.${action}`),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("../../application/hooks", () => ({
  useOperatorPaymentReadiness: (params: {
    attention?: string;
    page?: number;
    pageSize?: number;
    enabled?: boolean;
  } = {}) => {
    const enabled = params.enabled ?? true;
    if (!enabled) {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
        isSuccess: false,
        refetch: vi.fn(),
      };
    }
    mockList(params);
    const key = (params.attention ?? "all") as keyof typeof attentionResponses;
    const data = attentionResponses[key];
    return {
      data,
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: Boolean(data),
      refetch: vi.fn(),
    };
  },
}));

vi.mock("@features/compensation/presentation", () => ({
  TemplateAssignmentBatchSheet: () => null,
}));

vi.mock("@features/compensation/application/hooks", () => ({
  useCompensationTemplates: () => ({
    data: { data: [], pagination: { total: 0 } },
    isLoading: false,
    isError: false,
  }),
}));

const attentionRow: OperatorPaymentReadiness = {
  employeeId: "emp-m",
  fullName: "Martín Salas",
  employmentType: "permanent",
  status: "no_template",
  template: null,
  salary: { amount: 2500, period: "weekly" },
  hasClabe: true,
  openAdvancesCount: 0,
  openAdvancesBalance: 0,
  attentionReasons: ["no_template"],
};

const readyRow: OperatorPaymentReadiness = {
  employeeId: "emp-j",
  fullName: "Juan Pérez Ramírez",
  employmentType: "permanent",
  status: "ready",
  template: {
    id: "tpl-1",
    name: "Foráneo estándar",
    version: 1,
    effectiveFrom: "2026-09-01",
    payability: "active",
  },
  salary: { amount: 2500, period: "weekly" },
  hasClabe: true,
  openAdvancesCount: 1,
  openAdvancesBalance: 3000,
  attentionReasons: [],
};

function pageOf(
  rows: OperatorPaymentReadiness[],
  total = rows.length,
): PageResult {
  return {
    data: rows,
    pagination: { page: 1, limit: 25, total, totalPages: 1 },
  };
}

describe("OperatorPaymentsOperatorsPage F3", () => {
  beforeEach(() => {
    mockPermissions.granted = new Set([
      "settlements.read",
      "settlements.update",
    ]);
    mockList.mockReset();
    attentionResponses.needs_attention = pageOf([attentionRow], 1);
    attentionResponses.ready = pageOf([readyRow], 37);
    attentionResponses.all = pageOf([attentionRow, readyRow], 41);
  });

  it("default chip = Requieren atención cuando hay alguno; tabla + panel", async () => {
    renderWithTheme(<OperatorPaymentsOperatorsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("operators-chip-needs_attention")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByTestId("operators-row-emp-m")).toBeInTheDocument();
    expect(screen.getByTestId("operators-readiness-panel")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("operators-readiness-panel")).getByText(
        copy.panel.stepTariff,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.assignBatch }),
    ).toBeInTheDocument();
  });

  it("chip Listos filtra a ready", async () => {
    const user = userEvent.setup();
    renderWithTheme(<OperatorPaymentsOperatorsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("operators-chip-ready")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("operators-chip-ready"));

    await waitFor(() => {
      expect(screen.getByTestId("operators-row-emp-j")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("operators-row-emp-m")).not.toBeInTheDocument();
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ attention: "ready" }),
    );
  });

  it("default chip = Todos cuando nadie requiere atención", async () => {
    attentionResponses.needs_attention = pageOf([], 0);
    attentionResponses.all = pageOf([readyRow], 1);
    attentionResponses.ready = pageOf([readyRow], 1);

    renderWithTheme(<OperatorPaymentsOperatorsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("operators-chip-all")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  });
});
