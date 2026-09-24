import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { MonthField } from "./MonthField";
import {
  DATE_FIELD_COPY,
  formatMonthHeading,
  formatMonthTriggerLabel,
} from "./dateFieldUtils";

function MonthFieldHarness({
  initial = "",
  clearable = false,
}: {
  initial?: string;
  clearable?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MonthField
      id="periodo"
      value={value}
      onChange={setValue}
      clearable={clearable}
    />
  );
}

describe("MonthField", () => {
  it("shows the formatted month in the closed trigger, never the raw key", () => {
    render(<MonthFieldHarness initial="2026-07" />);
    expect(screen.getByRole("button")).toHaveTextContent(
      formatMonthTriggerLabel(2026, 7),
    );
    expect(screen.queryByText("2026-07")).not.toBeInTheDocument();
  });

  it("selects a month from the product calendar", async () => {
    const user = userEvent.setup();
    render(<MonthFieldHarness initial="2026-07" />);
    await user.click(
      screen.getByRole("button", { name: formatMonthTriggerLabel(2026, 7) }),
    );
    await user.click(
      screen.getByRole("button", { name: formatMonthHeading(2026, 8) }),
    );
    expect(screen.getByRole("button")).toHaveTextContent(
      formatMonthTriggerLabel(2026, 8),
    );
  });

  it("clears the selected month when clearable", async () => {
    const user = userEvent.setup();
    render(<MonthFieldHarness initial="2026-07" clearable />);
    await user.click(
      screen.getByRole("button", { name: DATE_FIELD_COPY.clearMonth }),
    );
    expect(screen.getByRole("button", { name: /elegir mes/i })).toHaveTextContent(
      DATE_FIELD_COPY.placeholderMonth,
    );
  });
});
