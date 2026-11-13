import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { monitoringCopy } from "../copy/monitoringCopy";
import { GpsModuleNotActivatedState } from "./GpsModuleNotActivatedState";

describe("GpsModuleNotActivatedState", () => {
  it("shows operative copy without purchase CTAs (F4.2 / F4.4)", () => {
    render(<GpsModuleNotActivatedState variant="page" />);

    expect(screen.getByTestId("gps-module-not-activated")).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.moduleGate.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.moduleGate.description),
    ).toBeInTheDocument();

    const blob = screen.getByTestId("gps-module-not-activated").textContent ?? "";
    expect(blob).not.toMatch(/comprar|upgrade|precio|suscripci[oó]n|plan/i);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("map variant keeps the same operative message", () => {
    render(<GpsModuleNotActivatedState variant="map" />);
    expect(
      screen.getByText(monitoringCopy.moduleGate.description),
    ).toBeInTheDocument();
  });
});
