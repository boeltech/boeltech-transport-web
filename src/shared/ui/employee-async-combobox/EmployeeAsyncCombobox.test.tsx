import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeAsyncCombobox } from "./EmployeeAsyncCombobox";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const { mockFetchEmployees, mockGetEmployeeBasic } = vi.hoisted(() => ({
  mockFetchEmployees: vi.fn(),
  mockGetEmployeeBasic: vi.fn(),
}));

vi.mock("@features/employees/infrastructure/employeeRepository", () => ({
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
  getEmployeeBasic: (...args: unknown[]) => mockGetEmployeeBasic(...args),
}));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("EmployeeAsyncCombobox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEmployees.mockResolvedValue({
      data: [
        {
          id: "emp-1",
          employee_number: "101",
          first_name: "Ana",
          last_name: "López",
          second_last_name: null,
          full_name: "Ana López",
          gender: null,
          department: null,
          position: "Conductor",
          employment_type: "permanent",
          hire_date: "2026-01-01",
          status: "active",
          is_active: true,
          email: null,
          phone: null,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
    mockGetEmployeeBasic.mockResolvedValue({
      id: "emp-1",
      employeeNumber: "101",
      fullName: "Ana López",
    });
  });

  it("permite seleccionar un operador en modo single", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithClient(
      <EmployeeAsyncCombobox mode="single" value="" onChange={onChange} id="emp-picker" />,
    );

    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("Ana López")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Ana López"));

    expect(onChange).toHaveBeenCalledWith("emp-1");
  });
});
