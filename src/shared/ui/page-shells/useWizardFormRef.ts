import { useEffect, type RefObject } from "react";
import type { WizardFormRef } from "./WizardPageShell";

interface UseWizardFormRefParams {
  formRef: RefObject<WizardFormRef | null>;
  triggerStepValidation: WizardFormRef["triggerStepValidation"];
  requestSubmit: WizardFormRef["requestSubmit"];
}

/**
 * Vincula el contrato `WizardFormRef` al shell sin duplicar wiring en páginas.
 */
export function useWizardFormRef({
  formRef,
  triggerStepValidation,
  requestSubmit,
}: UseWizardFormRefParams): void {
  useEffect(() => {
    formRef.current = {
      triggerStepValidation,
      requestSubmit,
    };
    return () => {
      formRef.current = null;
    };
  }, [formRef, requestSubmit, triggerStepValidation]);
}
