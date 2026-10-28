import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../opsTokens.css";
import { opsCopy } from "../opsCopy";
import { OpsSecretList } from "./OpsSecretList";

describe("OpsSecretList", () => {
  it("copies the given codes and switches the ghost label", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <div className="platform-ops">
        <OpsSecretList codes={["AAAA-1111", "BBBB-2222"]} />
      </div>,
    );

    expect(screen.getByText("AAAA-1111")).toHaveClass("ops-secret-code");
    expect(screen.getByText("BBBB-2222")).toBeInTheDocument();
    expect(screen.getByTestId("ops-secret-list")).not.toHaveAttribute(
      "data-ops-example",
    );
    expect(screen.queryByText(opsCopy.secrets.example)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: opsCopy.secrets.copy }),
    );

    expect(writeText).toHaveBeenCalledWith("AAAA-1111\nBBBB-2222");
    expect(
      screen.getByRole("button", { name: opsCopy.secrets.copied }),
    ).toBeInTheDocument();
  });

  it("marks an example list without inventing codes", () => {
    render(
      <div className="platform-ops">
        <OpsSecretList codes={["DEMO-1"]} example />
      </div>,
    );

    expect(screen.getByTestId("ops-secret-list")).toHaveAttribute(
      "data-ops-example",
      "true",
    );
    expect(screen.getByText(opsCopy.secrets.example)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("DEMO-1")).toBeInTheDocument();
  });
});
