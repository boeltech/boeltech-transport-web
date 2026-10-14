import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettlementPipelineQueue } from "./SettlementPipelineQueue";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

describe("SettlementPipelineQueue", () => {
  it("no renderiza empty local cuando la cola está vacía (lo resuelve la page)", () => {
    const { container } = render(
      <MemoryRouter>
        <SettlementPipelineQueue
          bucket="payable"
          settlements={[]}
          isLoading={false}
          viewMode="table"
          onView={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/Sin pagos/i)).not.toBeInTheDocument();
  });
});
