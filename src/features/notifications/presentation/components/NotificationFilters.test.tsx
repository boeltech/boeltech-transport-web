import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ListNotificationsFilters } from "../../domain";
import { notificationsCopy } from "../copy/notificationsCopy";
import { NotificationFilters } from "./NotificationFilters";

const copy = notificationsCopy.filter;

const baseFilters: ListNotificationsFilters = {
  status: "all",
  page: 1,
  pageSize: 25,
};

function renderFilters(
  overrides: Partial<ComponentProps<typeof NotificationFilters>> = {},
) {
  return render(
    <NotificationFilters
      filters={baseFilters}
      onChange={vi.fn()}
      activePanelFilterCount={0}
      {...overrides}
    />,
  );
}

describe("NotificationFilters", () => {
  it("muestra Filtros sin badge cuando no hay recortes (ListingFilterPanel)", () => {
    renderFilters();

    expect(
      screen.getByRole("button", { name: copy.showFilters }),
    ).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(notificationsCopy.status)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes activos", () => {
    renderFilters({
      filters: {
        ...baseFilters,
        status: "unread",
        source: "approvals",
        severity: "warning",
      },
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(notificationsCopy.status)).toBeInTheDocument();
    expect(screen.getByText(notificationsCopy.source)).toBeInTheDocument();
    expect(screen.getByText(notificationsCopy.severity)).toBeInTheDocument();
  });
});
