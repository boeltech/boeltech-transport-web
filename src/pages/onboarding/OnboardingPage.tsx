/**
 * Onboarding guiado de producto: pasos en WizardPageShell + cierre persistente vía API.
 */

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Map, Palette, Sparkles } from "lucide-react";

import { useAuth } from "@features/auth";
import { authApi } from "@features/auth/infrastructure";
import { ROLE_LABELS } from "@shared/constants/roles";
import type { UserRole } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { useTheme } from "@shared/hooks/useTheme";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells";
import type { WizardStep } from "@shared/ui/wizard";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { mapBackendError } from "@shared/utils/errorMapper";

const STEPS: WizardStep[] = [
  {
    id: "welcome",
    title: "Bienvenida",
    description: "Tu cuenta en Boeltech ERP",
  },
  {
    id: "preferences",
    title: "Preferencias",
    description: "Apariencia del sistema",
  },
  {
    id: "workspace",
    title: "Tu espacio",
    description: "Qué verás según tu rol",
  },
  {
    id: "review",
    title: "Confirmar",
    description: "Finalizar asistente",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const { mode, setMode } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wizardFormRef = useRef<WizardFormRef | null>(null);

  const displayName =
    user?.firstName?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role as UserRole] ?? user.role
    : "";

  const finish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await authApi.completeProductOnboarding();
      await refreshProfile();
      toast({
        title: "Configuración guardada",
        description: "Tu progreso quedó registrado en el servidor.",
        variant: "success",
      });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const mapped = mapBackendError(err);
      toast({
        title: "No se pudo finalizar",
        description: mapped.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, refreshProfile, toast]);

  useLayoutEffect(() => {
    wizardFormRef.current = {
      triggerStepValidation: async () => true,
      requestSubmit: () => {
        void finish();
      },
    };
  }, [finish]);

  const renderStep = useCallback(
    (currentStep: number) => {
      switch (currentStep) {
        case 0:
          return (
            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Hola, <span className="text-foreground font-medium">{displayName}</span>.
                Este asistente configura tu primera experiencia en el ERP: preferencias
                básicas y una vista rápida según tu rol
                {roleLabel ? (
                  <>
                    {" "}
                    (<span className="text-foreground">{roleLabel}</span>)
                  </>
                ) : null}
                . Al finalizar, marcaremos el onboarding como completado para no volver a
                mostrarlo en tus próximos accesos.
              </p>
            </div>
          );
        case 1:
          return (
            <div className="space-y-4">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
                <Palette className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="ob-theme">Modo oscuro</Label>
                  <p className="text-muted-foreground text-sm">
                    Puedes cambiarlo cuando quieras desde la barra superior.
                  </p>
                </div>
                <Switch
                  id="ob-theme"
                  checked={mode === "dark"}
                  onCheckedChange={(checked) =>
                    setMode(checked ? "dark" : "system")
                  }
                />
              </div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
                <Map className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                El menú lateral muestra solo los módulos que aplican a tu rol: viajes,
                vehículos, clientes, facturación y más. Si no ves una sección, es porque
                tu administrador no la ha habilitado para tu perfil.
              </p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Usa la búsqueda y los filtros en los listados para trabajar más rápido.</li>
                <li>Desde tu perfil puedes actualizar datos de cuenta cuando lo permita la empresa.</li>
              </ul>
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-soft">
                <CheckCircle className="h-6 w-6 text-success-soft-foreground" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Al pulsar <strong className="text-foreground">Finalizar y guardar</strong>,
                registramos en el servidor que completaste el onboarding y podrás usar el
                tablero y los módulos según tu rol. Este estado se conserva en tus próximos
                inicios de sesión.
              </p>
            </div>
          );
        default:
          return null;
      }
    },
    [displayName, roleLabel, mode, setMode],
  );

  return (
    <WizardPageShell
      steps={STEPS}
      formRef={wizardFormRef}
      header={{
        backHref: "/dashboard",
        backLabel: "Volver",
        icon: <Sparkles className="h-5 w-5" />,
        title: "Asistente de primer acceso",
        subtitle: "Configura tu experiencia en Boeltech ERP",
      }}
      headerBackMode="wizard"
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel="Finalizar y guardar"
      submittingLabel="Guardando…"
      stepsAriaLabel="Pasos del onboarding de producto"
    />
  );
}
