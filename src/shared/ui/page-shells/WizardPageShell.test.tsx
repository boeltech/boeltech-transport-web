import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WizardPageShell, type WizardFormRef } from "./WizardPageShell";

const toastSpy = vi.fn();

vi.mock("@shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@shared/hooks")>(
    "@shared/hooks",
  );
  return {
    ...actual,
    useToast: () => ({ toast: toastSpy }),
  };
});

function renderWizard({
  validateStep,
  onSubmit,
}: {
  validateStep: (stepIndex: number) => Promise<boolean>;
  onSubmit?: () => void;
}) {
  const formRef = createRef<WizardFormRef>();
  formRef.current = {
    triggerStepValidation: validateStep,
    requestSubmit: onSubmit ?? vi.fn(),
  };

  render(
    <MemoryRouter>
      <WizardPageShell
        steps={[
          { id: "one", title: "Paso 1", description: "Datos iniciales" },
          { id: "two", title: "Paso 2", description: "Más datos" },
          { id: "review", title: "Revisión", description: "Confirmar" },
        ]}
        formRef={formRef}
        header={{ backHref: "/", icon: <span>W</span>, title: "Wizard test" }}
        renderStep={(currentStep) => (
          <div>Contenido paso {currentStep + 1}</div>
        )}
        isSubmitting={false}
        submitLabel="Guardar"
      />
    </MemoryRouter>,
  );

  return {
    formRef,
    submitSpy: formRef.current.requestSubmit as ReturnType<typeof vi.fn>,
  };
}

describe("WizardPageShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("no dispara toast al fallar la validación al avanzar", async () => {
    const triggerStepValidation = vi.fn().mockResolvedValue(false);
    renderWizard({ validateStep: triggerStepValidation });

    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    expect(triggerStepValidation).toHaveBeenCalledWith(0);
    expect(screen.getByText("Contenido paso 1")).toBeInTheDocument();
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it("avanza al siguiente paso cuando la validación pasa", async () => {
    const triggerStepValidation = vi.fn().mockResolvedValue(true);
    renderWizard({ validateStep: triggerStepValidation });

    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    expect(triggerStepValidation).toHaveBeenCalledWith(0);
    expect(screen.getByText("Contenido paso 2")).toBeInTheDocument();
  });

  it("en confirmación valida todos los pasos y corta en el primero inválido sin toast", async () => {
    const triggerStepValidation = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const requestSubmit = vi.fn();
    renderWizard({ validateStep: triggerStepValidation, onSubmit: requestSubmit });

    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(triggerStepValidation).toHaveBeenNthCalledWith(1, 0);
    expect(triggerStepValidation).toHaveBeenNthCalledWith(2, 1);
    expect(triggerStepValidation).toHaveBeenNthCalledWith(3, 0);
    expect(triggerStepValidation).toHaveBeenNthCalledWith(4, 1);
    expect(requestSubmit).not.toHaveBeenCalled();
    expect(toastSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Contenido paso 2")).toBeInTheDocument();
  });
});
