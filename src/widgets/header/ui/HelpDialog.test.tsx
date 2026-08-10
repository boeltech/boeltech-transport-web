import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpDialog } from "./HelpDialog";

describe("HelpDialog", () => {
  it("shows support mailto and version context without docs when URL is empty", () => {
    render(
      <HelpDialog
        open
        onOpenChange={vi.fn()}
        userEmail="admin@demo.com"
        tenantName="Transportes Demo"
        currentPath="/dashboard"
        supportEmail="soporte@boeltech.com"
        helpDocsUrl=""
        environment="staging"
        release="deadbeef"
        productName="laTuno"
      />,
    );

    expect(screen.getByRole("heading", { name: "Ayuda" })).toBeInTheDocument();
    expect(screen.getByText("Transportes Demo")).toBeInTheDocument();
    expect(screen.getByText("admin@demo.com")).toBeInTheDocument();
    expect(screen.getByText("/dashboard")).toBeInTheDocument();
    expect(screen.getByText("staging")).toBeInTheDocument();
    expect(screen.getByText("deadbeef")).toBeInTheDocument();

    const contact = screen.getByRole("link", { name: /Contactar soporte/i });
    expect(contact).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:soporte@boeltech.com"),
    );
    expect(
      screen.queryByRole("link", { name: /Guías y documentación/i }),
    ).not.toBeInTheDocument();
  });

  it("shows docs link when helpDocsUrl is set", () => {
    render(
      <HelpDialog
        open
        onOpenChange={vi.fn()}
        currentPath="/"
        helpDocsUrl="https://docs.example.com/tlama"
        supportEmail="soporte@boeltech.com"
      />,
    );

    const docs = screen.getByRole("link", { name: /Guías y documentación/i });
    expect(docs).toHaveAttribute("href", "https://docs.example.com/tlama");
    expect(docs).toHaveAttribute("target", "_blank");
    expect(docs).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("closes when Cerrar is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <HelpDialog
        open
        onOpenChange={onOpenChange}
        currentPath="/"
        helpDocsUrl=""
      />,
    );

    await user.click(screen.getByRole("button", { name: /Cerrar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
