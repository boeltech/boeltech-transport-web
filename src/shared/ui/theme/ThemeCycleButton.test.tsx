import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { ThemeCycleButton } from "./ThemeToggle";

describe("ThemeCycleButton", () => {
  it("cycles aria-label through system, light and dark", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultMode="system">
        <ThemeCycleButton />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("button", { name: /Tema: Sistema/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tema: Sistema/i }));
    expect(
      screen.getByRole("button", { name: /Tema: Claro/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tema: Claro/i }));
    expect(
      screen.getByRole("button", { name: /Tema: Oscuro/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tema: Oscuro/i }));
    expect(
      screen.getByRole("button", { name: /Tema: Sistema/i }),
    ).toBeInTheDocument();
  });
});
