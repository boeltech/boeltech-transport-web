import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { formatDate } from "@shared/utils/dateUtils";

import { DateField } from "./DateField";
import { DATE_FIELD_COPY } from "./dateFieldUtils";
import { DateTimeField } from "./DateTimeField";

function DateFieldHarness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <DateField id="salida" value={value} onChange={setValue} />;
}

function DateTimeFieldHarness({
  initial = "",
  defaultTimeOnDateSelect,
}: {
  initial?: string;
  defaultTimeOnDateSelect?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateTimeField
      id="instante"
      value={value}
      onChange={setValue}
      defaultTimeOnDateSelect={defaultTimeOnDateSelect}
      presets={[{ label: "Hoy 08:00", value: "2026-03-10T08:00" }]}
    />
  );
}

describe("DateField", () => {
  it("shows formatDate in the closed trigger, never the ISO string", () => {
    render(<DateFieldHarness initial="2026-03-10" />);
    expect(screen.getByRole("button")).toHaveTextContent(formatDate("2026-03-10"));
    expect(screen.queryByText("2026-03-10")).not.toBeInTheDocument();
  });

  it("selects a day from the product calendar", async () => {
    const user = userEvent.setup();
    render(<DateFieldHarness initial="2026-03-10" />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "15" }));
    expect(screen.getByRole("button")).toHaveTextContent(formatDate("2026-03-15"));
  });

  it("jumps a year with the double chevron and picks a year from the heading", async () => {
    const user = userEvent.setup();
    render(<DateFieldHarness initial="2026-03-10" />);
    await user.click(screen.getByRole("button", { name: /10 mar 2026/i }));

    await user.click(screen.getByRole("button", { name: DATE_FIELD_COPY.nextYear }));
    expect(
      screen.getByRole("button", { name: DATE_FIELD_COPY.chooseYear }),
    ).toHaveTextContent(/2027/);

    await user.click(screen.getByRole("button", { name: DATE_FIELD_COPY.chooseYear }));
    await user.click(screen.getByRole("button", { name: "2020" }));
    expect(
      screen.getByRole("button", { name: DATE_FIELD_COPY.chooseYear }),
    ).toHaveTextContent(/2020/);
  });
});

describe("DateTimeField", () => {
  it("shows the Mexico caption and not the raw datetime-local value", () => {
    render(<DateTimeFieldHarness initial="2026-03-10T08:00" />);
    expect(screen.getByText(DATE_FIELD_COPY.mexicoTimeCaption)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /10 mar 2026/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("2026-03-10T08:00")).not.toBeInTheDocument();
  });

  it("fills default time when a day is chosen without an hour", async () => {
    const user = userEvent.setup();
    render(<DateTimeFieldHarness defaultTimeOnDateSelect="08:00" />);
    await user.click(screen.getByRole("button", { name: DATE_FIELD_COPY.placeholderDate }));
    await user.click(screen.getByRole("button", { name: "10" }));
    const time = screen.getByLabelText(DATE_FIELD_COPY.timeAriaLabel);
    expect(time).toHaveValue("08:00");
  });

  it("applies a preset value", async () => {
    const user = userEvent.setup();
    render(<DateTimeFieldHarness />);
    await user.click(screen.getByRole("button", { name: "Hoy 08:00" }));
    expect(screen.getByRole("button", { name: /10 mar 2026/i })).toBeInTheDocument();
    expect(screen.getByLabelText(DATE_FIELD_COPY.timeAriaLabel)).toHaveValue("08:00");
  });
});
