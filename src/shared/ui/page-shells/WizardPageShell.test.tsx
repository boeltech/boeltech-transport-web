import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
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
  initialStep,
}: {
  validateStep: (stepIndex: number) => Promise<boolean>;
  onSubmit?: () => void;
  initialStep?: number;
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
        initialStep={initialStep}
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

  it("abre en initialStep cuando se pasa (deep-link)", () => {
    renderWizard({
      validateStep: vi.fn().mockResolvedValue(true),
      initialStep: 1,
    });
    expect(screen.getByText("Contenido paso 2")).toBeInTheDocument();
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

  it("bloquea doble confirmación mientras valida pasos async", async () => {
    let resolveFirstValidation: ((value: boolean) => void) | undefined;
    const firstValidation = new Promise<boolean>((resolve) => {
      resolveFirstValidation = resolve;
    });
    const triggerStepValidation = vi
      .fn()
      .mockImplementationOnce(() => firstValidation)
      .mockResolvedValue(true);
    const requestSubmit = vi.fn();
    renderWizard({
      validateStep: triggerStepValidation,
      onSubmit: requestSubmit,
      initialStep: 2,
    });

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    await userEvent.click(submitButton);
    await userEvent.click(submitButton);

    expect(triggerStepValidation).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    resolveFirstValidation?.(true);
    await vi.waitFor(() => {
      expect(requestSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

describe("WizardPageShell header (NL2/NL4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  function renderHeader(
    header: Parameters<typeof WizardPageShell>[0]["header"],
  ) {
    const formRef = createRef<WizardFormRef>();
    formRef.current = {
      triggerStepValidation: vi.fn().mockResolvedValue(true),
      requestSubmit: vi.fn(),
    };

    render(
      <MemoryRouter>
        <WizardPageShell
          steps={[
            { id: "one", title: "Paso 1", description: "Datos" },
            { id: "review", title: "Revisión", description: "Confirmar" },
          ]}
          formRef={formRef}
          header={header}
          renderStep={() => <div>paso</div>}
          isSubmitting={false}
          submitLabel="Guardar"
        />
      </MemoryRouter>,
    );
  }

  it("staff: pinta migas, sin flecha ni ícono; Cancelar usa exitHref", () => {
    renderHeader({
      crumbs: [
        { label: "Vehículos", to: "/vehicles" },
        { label: "Nuevo vehículo" },
      ],
      exitHref: "/vehicles",
      title: "Nuevo vehículo",
    });

    const crumbsNav = screen.getByRole("navigation", { name: "Migas" });
    expect(crumbsNav).toBeInTheDocument();
    expect(within(crumbsNav).getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vehículos" })).toHaveAttribute(
      "href",
      "/vehicles",
    );
    expect(
      screen.queryByRole("button", { name: /volver/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("portal: pinta flecha y no migas", () => {
    renderHeader({
      variant: "portal",
      backHref: "/portal/trips",
      backLabel: "Volver al listado",
      title: "Nuevo viaje",
    });

    expect(
      screen.getByRole("button", { name: "Volver al listado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Migas" }),
    ).not.toBeInTheDocument();
  });

  it("legacy: flecha + ícono (smoke hasta migrar consumers)", () => {
    renderHeader({
      backHref: "/",
      icon: <span data-testid="entity-icon">W</span>,
      title: "Wizard legacy",
    });

    expect(
      screen.getByRole("button", { name: /volver/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("entity-icon")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Migas" }),
    ).not.toBeInTheDocument();
  });
});
