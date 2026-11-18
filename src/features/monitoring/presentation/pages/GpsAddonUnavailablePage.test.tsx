import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { monitoringCopy } from "../copy/monitoringCopy";
import { GpsAddonUnavailablePage } from "./GpsAddonUnavailablePage";

describe("GpsAddonUnavailablePage", () => {
  it("shows X9 copy without mentioning API", () => {
    render(<GpsAddonUnavailablePage />);
    const root = screen.getByTestId("gps-addon-unavailable");
    expect(root).toHaveTextContent(monitoringCopy.unavailable.title);
    expect(root).toHaveTextContent(monitoringCopy.unavailable.body);
    expect(root.textContent ?? "").not.toMatch(/API|entorno/i);
  });
});
