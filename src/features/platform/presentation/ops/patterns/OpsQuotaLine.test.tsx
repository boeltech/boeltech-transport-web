import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsQuotaLine } from "./OpsQuotaLine";

function stamps(used: number, included: number) {
  return render(
    <div className="platform-ops">
      <OpsQuotaLine kind="stamps" label="Timbres" used={used} included={included} />
    </div>,
  );
}

describe("OpsQuotaLine", () => {
  it("fills stamp usage with lime, ink, warn and danger at 70/80/100", () => {
    const { rerender } = stamps(69, 100);
    expect(screen.getByText("69 / 100")).toBeInTheDocument();
    expect(document.querySelector("[data-ops-quota-fill]")).toHaveAttribute(
      "data-ops-quota-fill",
      "lime",
    );
    expect(screen.getByTestId("ops-quota-line")).not.toHaveAttribute("data-ops-tick");

    rerender(
      <div className="platform-ops">
        <OpsQuotaLine kind="stamps" label="Timbres" used={70} included={100} />
      </div>,
    );
    expect(document.querySelector("[data-ops-quota-fill]")).toHaveAttribute(
      "data-ops-quota-fill",
      "ink",
    );

    rerender(
      <div className="platform-ops">
        <OpsQuotaLine kind="stamps" label="Timbres" used={80} included={100} />
      </div>,
    );
    expect(document.querySelector("[data-ops-quota-fill]")).toHaveAttribute(
      "data-ops-quota-fill",
      "warn",
    );
    expect(screen.getByTestId("ops-quota-line")).not.toHaveAttribute("data-ops-tick");

    rerender(
      <div className="platform-ops">
        <OpsQuotaLine kind="stamps" label="Timbres" used={100} included={100} />
      </div>,
    );
    expect(document.querySelector("[data-ops-quota-fill]")).toHaveAttribute(
      "data-ops-quota-fill",
      "danger",
    );
    expect(screen.getByTestId("ops-quota-line")).toHaveAttribute(
      "data-ops-tick",
      "danger",
    );
    expect(document.querySelector(".ops-quota-track")).toBeTruthy();
  });

  it("ticks branches only when overQuota is already true", () => {
    const { rerender } = render(
      <div className="platform-ops">
        <OpsQuotaLine
          kind="branches"
          label="Sucursales"
          usage={9}
          granted={10}
          overQuota={false}
        />
      </div>,
    );

    expect(screen.getByText("9 / 10")).toBeInTheDocument();
    expect(screen.getByTestId("ops-quota-line")).not.toHaveAttribute("data-ops-tick");
    expect(document.querySelector(".ops-quota-track")).toBeNull();
    expect(document.querySelector("[data-ops-quota-fill]")).toBeNull();

    rerender(
      <div className="platform-ops">
        <OpsQuotaLine
          kind="branches"
          label="Sucursales"
          usage={1}
          granted={10}
          overQuota
        />
      </div>,
    );
    expect(screen.getByTestId("ops-quota-line")).toHaveAttribute(
      "data-ops-tick",
      "danger",
    );
    expect(document.querySelector("[data-ops-quota-fill='warn']")).toBeNull();
  });

  it("does not invent a branch ratio when granted is missing", () => {
    render(
      <div className="platform-ops">
        <OpsQuotaLine
          kind="branches"
          label="Sucursales"
          usage={4}
          granted={null}
          overQuota={false}
        />
      </div>,
    );

    expect(screen.getByTestId("ops-quota-line")).toHaveTextContent("—");
    expect(screen.getByTestId("ops-quota-line")).not.toHaveTextContent("4 /");
    expect(document.querySelector(".ops-quota-track")).toBeNull();
  });

  it("shows history months as a number without a tick or a percent", () => {
    const { rerender } = render(
      <div className="platform-ops">
        <OpsQuotaLine kind="history" label="Meses de historial" granted={12} />
      </div>,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByText("12%")).not.toBeInTheDocument();
    expect(screen.getByTestId("ops-quota-line")).not.toHaveAttribute("data-ops-tick");
    expect(document.querySelector(".ops-quota-track")).toBeNull();

    rerender(
      <div className="platform-ops">
        <OpsQuotaLine kind="history" label="Meses de historial" granted={null} />
      </div>,
    );
    expect(screen.getByTestId("ops-quota-line")).toHaveTextContent("—");
    expect(screen.getByTestId("ops-quota-line")).not.toHaveAttribute("data-ops-tick");
  });
});
