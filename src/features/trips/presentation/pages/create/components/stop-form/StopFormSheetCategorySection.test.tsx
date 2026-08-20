import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapPin } from "lucide-react";

import { StopFormSheetCategorySection } from "./StopFormSheetCategorySection";
import { wizardCopy } from "../../../../copy";
import type { StopFormData } from "../stopDialogAddressMapper";

const copy = wizardCopy.route.stopForm.category;

const operations = [
  {
    value: "pickup",
    label: "Carga",
    icon: MapPin,
    color: "text-info",
  },
  {
    value: "delivery",
    label: "Descarga",
    icon: MapPin,
    color: "text-warning",
  },
];

function waypointStop(stopType: string[] = ["waypoint"]): StopFormData {
  return {
    stopCategory: "waypoint",
    stopType: stopType as StopFormData["stopType"],
  };
}

describe("StopFormSheetCategorySection", () => {
  it("toggles operation via checkbox onCheckedChange", async () => {
    const user = userEvent.setup();
    const onOperationToggle = vi.fn();

    render(
      <StopFormSheetCategorySection
        displayStop={waypointStop(["waypoint"])}
        getAvailableOperations={() => operations}
        onOperationToggle={onOperationToggle}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Carga" }));
    expect(onOperationToggle).toHaveBeenCalledWith("pickup");
  });

  it("exposes checkboxes for keyboard/AT", () => {
    render(
      <StopFormSheetCategorySection
        displayStop={waypointStop(["waypoint", "pickup"])}
        getAvailableOperations={() => operations}
        onOperationToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Carga" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Descarga" })).not.toBeChecked();
    expect(
      screen.getByRole("group", { name: copy.waypointQuestion }),
    ).toBeInTheDocument();
  });
});
