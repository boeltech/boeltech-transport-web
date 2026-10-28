import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OpsAuditLogPage } from "./OpsAuditLogPage";
import { opsCopy } from "./opsCopy";

const { mockUsePlatformAuditLog } = vi.hoisted(() => ({
  mockUsePlatformAuditLog: vi.fn(),
}));

vi.mock("../../application/hooks/usePlatformAuditLog", () => ({
  usePlatformAuditLog: (...args: unknown[]) => mockUsePlatformAuditLog(...args),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPlans: () => ({ data: [] }),
  usePlatformTenant: () => ({ data: undefined }),
}));

describe("OpsAuditLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformAuditLog.mockReturnValue({
      data: {
        data: [
          {
            id: "a1",
            action: "tenant_created",
            createdAt: "2026-10-01T12:00:00.000Z",
            platformUserEmail: "ops@test.com",
            actorUserId: "u1",
            targetTenantId: "t1",
            targetTenantName: "Norte",
            targetTenantSubdomain: "norte",
            metadata: {},
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders an audit line without the badge table", () => {
    renderWithTheme(<OpsAuditLogPage />, {
      route: ["/platform/audit"],
    });

    expect(screen.getByTestId("platform-ops-audit")).toBeInTheDocument();
    expect(screen.queryByTestId("ops-table")).not.toBeInTheDocument();
    const line = screen.getByTestId("ops-audit-line");
    expect(line).toHaveTextContent("ops@test.com");
    expect(line).toHaveTextContent("Empresa creada");
    expect(line.querySelector("[data-destructive]")).toHaveAttribute(
      "data-destructive",
      "false",
    );
    expect(screen.getByText(opsCopy.audit.title)).toBeInTheDocument();
  });
});
