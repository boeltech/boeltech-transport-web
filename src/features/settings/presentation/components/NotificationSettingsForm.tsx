/**
 * NotificationSettingsForm Component
 *
 * Formulario para configurar las preferencias de notificaciones.
 *
 * Ubicación: src/features/settings/ui/components/NotificationSettingsForm.tsx
 */

import { memo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { Skeleton } from "@shared/ui/skeleton";
import { Separator } from "@shared/ui/separator";

import { SettingsCard } from "./SettingsLayout";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "../../application/hooks";
import type {
  NotificationSettings,
  UpdateNotificationSettingsDTO,
} from "../../domain";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  tripReminders: z.boolean(),
  tripReminderHours: z.number().min(1).max(72),
  maintenanceAlerts: z.boolean(),
  maintenanceAlertDays: z.number().min(1).max(90),
  documentExpiryAlerts: z.boolean(),
  documentExpiryDays: z.number().min(1).max(90),
  dailyDigest: z.boolean(),
  digestTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm"),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export const NotificationSettingsForm = memo(
  function NotificationSettingsForm() {
    const { data: settings, isLoading, isError } = useNotificationSettings();
    const updateMutation = useUpdateNotificationSettings();

    const form = useForm<NotificationSettingsFormData>({
      resolver: zodResolver(notificationSettingsSchema),
      defaultValues: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        tripReminders: true,
        tripReminderHours: 24,
        maintenanceAlerts: true,
        maintenanceAlertDays: 7,
        documentExpiryAlerts: true,
        documentExpiryDays: 30,
        dailyDigest: false,
        digestTime: "08:00",
      },
    });

    // Sincronizar con datos del servidor
    useEffect(() => {
      if (settings) {
        form.reset(mapSettingsToForm(settings));
      }
    }, [settings, form]);

    const onSubmit = useCallback(
      (data: NotificationSettingsFormData) => {
        const dto: UpdateNotificationSettingsDTO = {
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          pushNotifications: data.pushNotifications,
          tripReminders: data.tripReminders,
          tripReminderHours: data.tripReminderHours,
          maintenanceAlerts: data.maintenanceAlerts,
          maintenanceAlertDays: data.maintenanceAlertDays,
          documentExpiryAlerts: data.documentExpiryAlerts,
          documentExpiryDays: data.documentExpiryDays,
          dailyDigest: data.dailyDigest,
          digestTime: data.digestTime,
        };

        updateMutation.mutate(dto);
      },
      [updateMutation],
    );

    if (isLoading) {
      return <NotificationSettingsFormSkeleton />;
    }

    if (isError) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Error al cargar las preferencias. Por favor, intenta de nuevo.
        </div>
      );
    }

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Canales de notificación */}
        <SettingsCard
          title="Canales de notificación"
          description="Elige cómo quieres recibir las notificaciones"
        >
          <div className="space-y-4">
            <NotificationToggle
              icon={Mail}
              label="Notificaciones por email"
              description="Recibe alertas y resúmenes en tu correo"
              checked={form.watch("emailNotifications")}
              onCheckedChange={(checked) =>
                form.setValue("emailNotifications", checked, {
                  shouldDirty: true,
                })
              }
            />

            <Separator />

            <NotificationToggle
              icon={Smartphone}
              label="Notificaciones push"
              description="Alertas en tiempo real en tu dispositivo"
              checked={form.watch("pushNotifications")}
              onCheckedChange={(checked) =>
                form.setValue("pushNotifications", checked, {
                  shouldDirty: true,
                })
              }
            />

            <Separator />

            <NotificationToggle
              icon={MessageSquare}
              label="Notificaciones por SMS"
              description="Alertas críticas vía mensaje de texto"
              checked={form.watch("smsNotifications")}
              onCheckedChange={(checked) =>
                form.setValue("smsNotifications", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>
        </SettingsCard>

        {/* Alertas de operaciones */}
        <SettingsCard
          title="Alertas de operaciones"
          description="Configura las alertas relacionadas con viajes y flota"
        >
          <div className="space-y-6">
            {/* Recordatorios de viajes */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <NotificationToggle
                  icon={Bell}
                  label="Recordatorios de viajes"
                  description="Notifica antes de la hora de salida programada"
                  checked={form.watch("tripReminders")}
                  onCheckedChange={(checked) =>
                    form.setValue("tripReminders", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              {form.watch("tripReminders") && (
                <div className="sm:w-32">
                  <Label htmlFor="tripReminderHours">Horas antes</Label>
                  <Input
                    id="tripReminderHours"
                    type="number"
                    min={1}
                    max={72}
                    {...form.register("tripReminderHours", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Alertas de mantenimiento */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <NotificationToggle
                  icon={Bell}
                  label="Alertas de mantenimiento"
                  description="Avisa cuando un vehículo requiere servicio"
                  checked={form.watch("maintenanceAlerts")}
                  onCheckedChange={(checked) =>
                    form.setValue("maintenanceAlerts", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              {form.watch("maintenanceAlerts") && (
                <div className="sm:w-32">
                  <Label htmlFor="maintenanceAlertDays">Días antes</Label>
                  <Input
                    id="maintenanceAlertDays"
                    type="number"
                    min={1}
                    max={90}
                    {...form.register("maintenanceAlertDays", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Vencimiento de documentos */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <NotificationToggle
                  icon={Bell}
                  label="Vencimiento de documentos"
                  description="Alerta cuando licencias o permisos están por vencer"
                  checked={form.watch("documentExpiryAlerts")}
                  onCheckedChange={(checked) =>
                    form.setValue("documentExpiryAlerts", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              {form.watch("documentExpiryAlerts") && (
                <div className="sm:w-32">
                  <Label htmlFor="documentExpiryDays">Días antes</Label>
                  <Input
                    id="documentExpiryDays"
                    type="number"
                    min={1}
                    max={90}
                    {...form.register("documentExpiryDays", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              )}
            </div>
          </div>
        </SettingsCard>

        {/* Resumen diario */}
        <SettingsCard
          title="Resumen diario"
          description="Recibe un resumen de la actividad del día"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <NotificationToggle
                icon={Mail}
                label="Enviar resumen diario"
                description="Un email con el resumen de viajes, alertas y pendientes"
                checked={form.watch("dailyDigest")}
                onCheckedChange={(checked) =>
                  form.setValue("dailyDigest", checked, { shouldDirty: true })
                }
              />
            </div>
            {form.watch("dailyDigest") && (
              <div className="sm:w-32">
                <Label htmlFor="digestTime">Hora de envío</Label>
                <Input
                  id="digestTime"
                  type="time"
                  {...form.register("digestTime")}
                />
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={!form.formState.isDirty || updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Guardar preferencias
          </Button>
        </div>
      </form>
    );
  },
);

// ============================================================================
// NOTIFICATION TOGGLE
// ============================================================================

interface NotificationToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const NotificationToggle = memo(function NotificationToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: NotificationToggleProps) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

function NotificationSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function mapSettingsToForm(
  settings: NotificationSettings,
): NotificationSettingsFormData {
  return {
    emailNotifications: settings.emailNotifications,
    smsNotifications: settings.smsNotifications,
    pushNotifications: settings.pushNotifications,
    tripReminders: settings.tripReminders,
    tripReminderHours: settings.tripReminderHours,
    maintenanceAlerts: settings.maintenanceAlerts,
    maintenanceAlertDays: settings.maintenanceAlertDays,
    documentExpiryAlerts: settings.documentExpiryAlerts,
    documentExpiryDays: settings.documentExpiryDays,
    dailyDigest: settings.dailyDigest,
    digestTime: settings.digestTime,
  };
}
