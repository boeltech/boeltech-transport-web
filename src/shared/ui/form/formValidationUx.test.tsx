import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { Input } from "@shared/ui/input";
import {
  FieldInlineError,
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
  normalizeRequiredFieldLabel,
  RHFTextField,
} from "@shared/ui/form";

describe("normalizeRequiredFieldLabel", () => {
  it("strips trailing asterisk from string labels and marks required once", () => {
    const { displayLabel, required, showRequiredMark } = normalizeRequiredFieldLabel(
      "Nombre(s) *",
      undefined,
    );
    expect(displayLabel).toBe("Nombre(s)");
    expect(required).toBe(true);
    expect(showRequiredMark).toBe(true);
  });

  it("does not add shell asterisk when label node already includes one", () => {
    const label = (
      <>
        Régimen Fiscal <span className="text-destructive">*</span>
      </>
    );
    const { showRequiredMark, required } = normalizeRequiredFieldLabel(label, true);
    expect(required).toBe(true);
    expect(showRequiredMark).toBe(false);
  });
});

describe("FormFieldShell required mark", () => {
  it("renders a single asterisk for legacy label strings with trailing *", () => {
    render(
      <FormFieldShell fieldId="firstName" label="Nombre(s) *" required>
        <input id="firstName" aria-label="Nombre" />
      </FormFieldShell>,
    );
    expect(screen.getByText("Nombre(s)")).toBeInTheDocument();
    const asterisks = screen.getAllByText("*");
    expect(asterisks).toHaveLength(1);
    expect(asterisks[0]).toHaveClass("text-destructive");
  });
});

describe("FieldInlineError", () => {
  it("renders message with stable id for aria-describedby", () => {
    render(<FieldInlineError fieldId="email" message="Correo inválido" />);
    const el = screen.getByText("Correo inválido");
    expect(el).toHaveAttribute("id", "email-error");
    expect(el).toHaveClass("text-xs", "text-destructive");
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<FieldInlineError fieldId="email" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("getFieldErrorAriaProps", () => {
  it("links control to error id when message is present", () => {
    expect(getFieldErrorAriaProps("legalName", "Requerido")).toEqual({
      "aria-invalid": true,
      "aria-describedby": "legalName-error",
    });
  });

  it("sets aria-invalid false without describedby when no message", () => {
    expect(getFieldErrorAriaProps("legalName")).toEqual({ "aria-invalid": false });
  });
});

describe("getRegisterFieldErrorProps", () => {
  it("combines error border prop and ARIA for register() fields", () => {
    expect(getRegisterFieldErrorProps("password", "Mínimo 8 caracteres")).toEqual({
      error: true,
      "aria-invalid": true,
      "aria-describedby": "password-error",
    });
  });
});

describe("Input error state", () => {
  it("applies destructive border when error is true", () => {
    render(<Input id="test" error data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveClass("border-destructive");
  });

  it("wires aria from getRegisterFieldErrorProps", () => {
    render(
      <Input
        id="email"
        data-testid="input"
        {...getRegisterFieldErrorProps("email", "Correo requerido")}
      />,
    );
    const input = screen.getByTestId("input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    render(<FieldInlineError fieldId="email" message="Correo requerido" />);
    expect(document.getElementById("email-error")).toBeTruthy();
  });
});

describe("FormValidationSummary", () => {
  it("lists validation messages with contextual title", () => {
    render(
      <FormValidationSummary
        messages={["Campo A requerido", "Campo B inválido"]}
        title="Revisa el formulario"
      />,
    );
    expect(screen.getByText("Revisa el formulario")).toBeInTheDocument();
    expect(screen.getByText("Campo A requerido")).toBeInTheDocument();
    expect(screen.getByText("Campo B inválido")).toBeInTheDocument();
  });
});

describe("RHFTextField", () => {
  const schema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
  });

  function TestForm() {
    const form = useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
      defaultValues: { name: "" },
    });

    return (
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <RHFTextField control={form.control} name="name" label="Nombre" />
        <button type="submit">Guardar</button>
      </form>
    );
  }

  it("shows #fieldId-error and destructive border after failed submit", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    const error = await screen.findByText("El nombre es obligatorio");
    expect(error).toHaveAttribute("id", "name-error");

    const input = screen.getByLabelText("Nombre") as HTMLInputElement;
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "name-error");
    expect(input).toHaveClass("border-destructive");
  });
});
