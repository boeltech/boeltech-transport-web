import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoeltechCategoryBar } from "@shared/ui/data-display";

describe("BoeltechCategoryBar", () => {
  it("renders segments and skips zero values", () => {
    render(
      <BoeltechCategoryBar
        segments={[
          { key: "a", label: "Realizado", value: 100, token: "success" },
          { key: "b", label: "Pipeline", value: 0, token: "info" },
          { key: "c", label: "Cancelación", value: 50, token: "destructive" },
        ]}
        valueFormatter={(n) => `$${n}`}
        aria-label="Test bar"
      />,
    );

    expect(screen.getByText("Realizado")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("Cancelación")).toBeInTheDocument();
    expect(screen.queryByText("Pipeline")).not.toBeInTheDocument();
  });
});
