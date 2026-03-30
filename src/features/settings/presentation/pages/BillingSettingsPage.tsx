/**
 * BillingSettingsPage
 *
 * Página de configuración de facturación electrónica (CFDI).
 * Incluye configuración de PAC, certificados y valores por defecto.
 *
 * Ubicación: src/features/settings/ui/pages/BillingSettingsPage.tsx
 */

import { memo, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileKey,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";

import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsCard } from "../components/SettingsLayout";
import {
  useBillingSettings,
  useUpdateBillingSettings,
  useUploadCertificate,
  useTestPacConnection,
} from "../../application/hooks";
import {
  PAC_PROVIDER_LABELS,
  type BillingSettings,
  type UpdateBillingSettingsDTO,
} from "../../domain";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const billingSettingsSchema = z.object({
  pacProvider: z.string().min(1, "Selecciona un proveedor"),
  pacUsername: z.string().min(1, "El usuario es requerido"),
  pacPassword: z.string().optional(),
  defaultUsoCfdi: z.string().min(1, "Selecciona un uso de CFDI"),
  defaultFormaPago: z.string().min(1, "Selecciona una forma de pago"),
  defaultMetodoPago: z.string().min(1, "Selecciona un método de pago"),
  serieFactura: z
    .string()
    .min(1, "La serie es requerida")
    .max(5, "Máximo 5 caracteres"),
  folioInicial: z.number().min(1, "El folio inicial debe ser mayor a 0"),
  testMode: z.boolean(),
});

type BillingSettingsFormData = z.infer<typeof billingSettingsSchema>;

// ============================================================================
// CATALOG OPTIONS (idealmente vendrían del módulo de catálogos)
// ============================================================================

const USO_CFDI_OPTIONS = [
  { code: "G01", name: "Adquisición de mercancías" },
  { code: "G02", name: "Devoluciones, descuentos o bonificaciones" },
  { code: "G03", name: "Gastos en general" },
  { code: "I01", name: "Construcciones" },
  { code: "I02", name: "Mobiliario y equipo de oficina por inversiones" },
  { code: "I03", name: "Equipo de transporte" },
  { code: "P01", name: "Por definir" },
  { code: "S01", name: "Sin efectos fiscales" },
];

const FORMA_PAGO_OPTIONS = [
  { code: "01", name: "Efectivo" },
  { code: "02", name: "Cheque nominativo" },
  { code: "03", name: "Transferencia electrónica de fondos" },
  { code: "04", name: "Tarjeta de crédito" },
  { code: "28", name: "Tarjeta de débito" },
  { code: "99", name: "Por definir" },
];

const METODO_PAGO_OPTIONS = [
  { code: "PUE", name: "Pago en una sola exhibición" },
  { code: "PPD", name: "Pago en parcialidades o diferido" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const BillingSettingsPage = memo(function BillingSettingsPage() {
  const { data: settings, isLoading, isError } = useBillingSettings();
  const updateMutation = useUpdateBillingSettings();
  const testConnectionMutation = useTestPacConnection();

  const form = useForm<BillingSettingsFormData>({
    resolver: zodResolver(billingSettingsSchema),
    values: settings ? mapSettingsToForm(settings) : undefined,
  });

  const onSubmit = useCallback(
    (data: BillingSettingsFormData) => {
      const dto: UpdateBillingSettingsDTO = {
        pacProvider: data.pacProvider,
        pacUsername: data.pacUsername,
        defaultUsoCfdi: data.defaultUsoCfdi,
        defaultFormaPago: data.defaultFormaPago,
        defaultMetodoPago: data.defaultMetodoPago,
        serieFactura: data.serieFactura,
        folioInicial: data.folioInicial,
        testMode: data.testMode,
      };

      // Solo incluir password si se modificó
      if (data.pacPassword && data.pacPassword.length > 0) {
        dto.pacPassword = data.pacPassword;
      }

      updateMutation.mutate(dto);
    },
    [updateMutation],
  );

  const handleTestConnection = useCallback(() => {
    testConnectionMutation.mutate();
  }, [testConnectionMutation]);

  if (isLoading) {
    return (
      <SettingsLayout sectionTitle="Facturación">
        <BillingSettingsPageSkeleton />
      </SettingsLayout>
    );
  }

  if (isError) {
    return (
      <SettingsLayout sectionTitle="Facturación">
        <div className="text-center py-12 text-muted-foreground">
          Error al cargar la configuración. Por favor, intenta de nuevo.
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout sectionTitle="Facturación">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Modo de prueba */}
        {settings?.testMode && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Modo de prueba activo</AlertTitle>
            <AlertDescription>
              Las facturas se timbrarán en ambiente de pruebas y no tendrán
              validez fiscal. Desactiva el modo de prueba cuando estés listo
              para producción.
            </AlertDescription>
          </Alert>
        )}

        {/* Proveedor PAC */}
        <SettingsCard
          title="Proveedor de timbrado (PAC)"
          description="Configura la conexión con tu Proveedor Autorizado de Certificación"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* PAC Provider */}
            <div>
              <Label htmlFor="pacProvider">
                Proveedor PAC <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("pacProvider") ?? ""}
                onValueChange={(value) => {
                  if (value)
                    form.setValue("pacProvider", value, { shouldDirty: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAC_PROVIDER_LABELS).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.pacProvider && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.pacProvider.message}
                </p>
              )}
            </div>

            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between sm:col-span-2 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">Modo de prueba</p>
                <p className="text-sm text-muted-foreground">
                  Timbrar facturas en ambiente de pruebas
                </p>
              </div>
              <Switch
                checked={form.watch("testMode")}
                onCheckedChange={(checked) =>
                  form.setValue("testMode", checked, { shouldDirty: true })
                }
              />
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="pacUsername">
                Usuario <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pacUsername"
                {...form.register("pacUsername")}
                placeholder="usuario@empresa.com"
              />
              {form.formState.errors.pacUsername && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.pacUsername.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="pacPassword">
                Contraseña
                {settings?.pacPasswordConfigured && (
                  <Badge variant="secondary" className="ml-2">
                    Configurada
                  </Badge>
                )}
              </Label>
              <Input
                id="pacPassword"
                type="password"
                {...form.register("pacPassword")}
                placeholder={
                  settings?.pacPasswordConfigured
                    ? "••••••••"
                    : "Ingresa la contraseña"
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deja en blanco para mantener la contraseña actual
              </p>
            </div>

            {/* Test Connection Button */}
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Probar conexión
              </Button>
            </div>
          </div>
        </SettingsCard>

        {/* Certificado de Sello Digital */}
        <CertificateCard settings={settings!} />

        {/* Valores por defecto CFDI */}
        <SettingsCard
          title="Valores por defecto"
          description="Estos valores se usarán automáticamente en nuevas facturas"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Uso CFDI */}
            <div>
              <Label htmlFor="defaultUsoCfdi">
                Uso de CFDI <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("defaultUsoCfdi") ?? ""}
                onValueChange={(value) => {
                  if (value)
                    form.setValue("defaultUsoCfdi", value, {
                      shouldDirty: true,
                    });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar uso" />
                </SelectTrigger>
                <SelectContent>
                  {USO_CFDI_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.code} - {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forma de Pago */}
            <div>
              <Label htmlFor="defaultFormaPago">
                Forma de Pago <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("defaultFormaPago") ?? ""}
                onValueChange={(value) => {
                  if (value)
                    form.setValue("defaultFormaPago", value, {
                      shouldDirty: true,
                    });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar forma" />
                </SelectTrigger>
                <SelectContent>
                  {FORMA_PAGO_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.code} - {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Método de Pago */}
            <div>
              <Label htmlFor="defaultMetodoPago">
                Método de Pago <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("defaultMetodoPago") ?? ""}
                onValueChange={(value) => {
                  if (value)
                    form.setValue("defaultMetodoPago", value, {
                      shouldDirty: true,
                    });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {METODO_PAGO_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.code} - {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsCard>

        {/* Foliación */}
        <SettingsCard
          title="Foliación"
          description="Configura la serie y numeración de tus facturas"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Serie */}
            <div>
              <Label htmlFor="serieFactura">
                Serie <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serieFactura"
                {...form.register("serieFactura")}
                placeholder="A"
                maxLength={5}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 5 caracteres
              </p>
            </div>

            {/* Folio Inicial */}
            <div>
              <Label htmlFor="folioInicial">
                Folio Inicial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="folioInicial"
                type="number"
                min={1}
                {...form.register("folioInicial", { valueAsNumber: true })}
                placeholder="1"
              />
            </div>

            {/* Folio Actual (solo lectura) */}
            {settings && (
              <div className="sm:col-span-2 p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Folio actual:{" "}
                  <span className="font-medium text-foreground">
                    {settings.serieFactura}-{settings.folioActual}
                  </span>
                </p>
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
            Guardar cambios
          </Button>
        </div>
      </form>
    </SettingsLayout>
  );
});

// ============================================================================
// CERTIFICATE CARD
// ============================================================================

interface CertificateCardProps {
  settings: BillingSettings;
}

const CertificateCard = memo(function CertificateCard({
  settings,
}: CertificateCardProps) {
  const uploadMutation = useUploadCertificate();
  const [files, setFiles] = useState<{
    certificate: File | null;
    privateKey: File | null;
    password: string;
  }>({
    certificate: null,
    privateKey: null,
    password: "",
  });

  const handleUpload = useCallback(() => {
    if (!files.certificate || !files.privateKey || !files.password) return;

    uploadMutation.mutate({
      certificate: files.certificate,
      privateKey: files.privateKey,
      password: files.password,
    });
  }, [files, uploadMutation]);

  const isExpiringSoon =
    settings.certificateExpiry &&
    new Date(settings.certificateExpiry) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <SettingsCard
      title="Certificado de Sello Digital (CSD)"
      description="Certificado emitido por el SAT para firmar facturas"
      actions={
        settings.certificateConfigured ? (
          <Badge
            variant={isExpiringSoon ? "warning" : "success"}
            className="shrink-0"
          >
            {settings.certificateConfigured ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                No configurado
              </>
            )}
          </Badge>
        ) : null
      }
    >
      <div className="space-y-4">
        {settings.certificateConfigured && settings.certificateExpiry && (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm">
              Vence:{" "}
              <span
                className={
                  isExpiringSoon
                    ? "font-medium text-warning"
                    : "font-medium text-foreground"
                }
              >
                {new Date(settings.certificateExpiry).toLocaleDateString(
                  "es-MX",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </p>
            {isExpiringSoon && (
              <p className="text-xs text-warning mt-1">
                El certificado vence pronto. Renuévalo antes de la fecha de
                expiración.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Certificate File */}
          <div>
            <Label>Certificado (.cer)</Label>
            <div className="mt-1">
              <input
                type="file"
                accept=".cer"
                id="certificate-file"
                className="sr-only"
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    certificate: e.target.files?.[0] || null,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <label htmlFor="certificate-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {files.certificate?.name || "Seleccionar archivo"}
                </label>
              </Button>
            </div>
          </div>

          {/* Private Key File */}
          <div>
            <Label>Llave privada (.key)</Label>
            <div className="mt-1">
              <input
                type="file"
                accept=".key"
                id="privatekey-file"
                className="sr-only"
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    privateKey: e.target.files?.[0] || null,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <label htmlFor="privatekey-file" className="cursor-pointer">
                  <FileKey className="h-4 w-4 mr-2" />
                  {files.privateKey?.name || "Seleccionar archivo"}
                </label>
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="sm:col-span-2">
            <Label htmlFor="cert-password">Contraseña del certificado</Label>
            <Input
              id="cert-password"
              type="password"
              value={files.password}
              onChange={(e) =>
                setFiles((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Contraseña de la llave privada"
            />
          </div>

          {/* Upload Button */}
          <div className="sm:col-span-2">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={
                !files.certificate ||
                !files.privateKey ||
                !files.password ||
                uploadMutation.isPending
              }
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {settings.certificateConfigured
                ? "Actualizar certificado"
                : "Cargar certificado"}
            </Button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

function BillingSettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
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

function mapSettingsToForm(settings: BillingSettings): BillingSettingsFormData {
  return {
    pacProvider: settings.pacProvider,
    pacUsername: settings.pacUsername,
    pacPassword: "",
    defaultUsoCfdi: settings.defaultUsoCfdi,
    defaultFormaPago: settings.defaultFormaPago,
    defaultMetodoPago: settings.defaultMetodoPago,
    serieFactura: settings.serieFactura,
    folioInicial: settings.folioInicial,
    testMode: settings.testMode,
  };
}
