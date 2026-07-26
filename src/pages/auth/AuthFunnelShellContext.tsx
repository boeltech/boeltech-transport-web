/**
 * Contexto del shell auth: permite inyectar contenido en el panel de marca
 * (p. ej. stepper vertical del registro) sin cambiar AuthLayout.
 */
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthFunnelShellContextValue = {
  brandSlot: ReactNode | null;
  setBrandSlot: (node: ReactNode | null) => void;
};

const AuthFunnelShellContext =
  createContext<AuthFunnelShellContextValue | null>(null);

export function AuthFunnelShellProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [brandSlot, setBrandSlotState] = useState<ReactNode | null>(null);
  const setBrandSlot = useCallback((node: ReactNode | null) => {
    setBrandSlotState(node);
  }, []);

  const value = useMemo(
    () => ({ brandSlot, setBrandSlot }),
    [brandSlot, setBrandSlot],
  );

  return (
    <AuthFunnelShellContext.Provider value={value}>
      {children}
    </AuthFunnelShellContext.Provider>
  );
}

export function useAuthFunnelShell() {
  const ctx = useContext(AuthFunnelShellContext);
  if (!ctx) {
    throw new Error(
      "useAuthFunnelShell debe usarse dentro de AuthFunnelShellProvider",
    );
  }
  return ctx;
}

/**
 * Publica un nodo en el panel izquierdo de marca.
 * Pasar deps estables (p. ej. step); el render ocurre dentro del effect.
 */
export function useAuthFunnelBrandSlot(
  render: () => ReactNode,
  deps: ReadonlyArray<unknown>,
) {
  const { setBrandSlot } = useAuthFunnelShell();

  useLayoutEffect(() => {
    setBrandSlot(render());
    return () => setBrandSlot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps explícitas del caller
  }, [setBrandSlot, ...deps]);
}
