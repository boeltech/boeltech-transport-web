import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { notificationSettingsCopy } from "../copy/notificationSettingsCopy";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

vi.mock("../../application/hooks", () => ({
  useNotificationSettings: () => ({
    data: {
      id: "notif-1",
      tenantId: "tenant-1",
      documentExpiryAlerts: true,
      documentExpiryDays: 30,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdateNotificationSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Data router required: useUnsavedChangesGuard → useBlocker.
function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/settings/notifications",
        element: (
          <QueryClientProvider client={client}>
            <NotificationSettingsForm />
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: ["/settings/notifications"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("NotificationSettingsForm F2 (D11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("monta FormSticky sticky=false, Guardar disabled sin dirty y sin LongForm", () => {
    const { container } = renderForm();
    const copy = notificationSettingsCopy;

    expect(screen.getByText(copy.documents.title)).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /secciones/i }),
    ).toBeNull();
    expect(container.querySelector(".sticky.bottom-0")).toBeNull();
    expect(
      screen.getByRole("button", { name: copy.action.cancel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.save }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: copy.action.viewInbox }),
    ).toBeInTheDocument();
  });
});
