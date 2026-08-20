/**
 * FormsSection
 *
 * Muestra los primitives de formulario: Input, Label, Textarea, Select,
 * Checkbox, Switch. Estados: default, focus, disabled, error.
 *
 * Todos los componentes usan tokens del DS. Los estados de error usan
 * el token `--destructive` para que cualquier recalibración propague.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { Checkbox } from "@shared/ui/checkbox";
import { Switch } from "@shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { DateField, DateTimeField } from "@shared/ui/form";

export function FormsSection() {
  const [checked, setChecked] = useState<boolean | "indeterminate">(true);
  const [switchOn, setSwitchOn] = useState(true);
  const [selectValue, setSelectValue] = useState("scheduled");
  const [civilDate, setCivilDate] = useState("2026-03-10");
  const [instant, setInstant] = useState("2026-03-10T08:00");

  return (
    <div className="space-y-8">
      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRow label="Default">
            <div className="space-y-1.5">
              <Label htmlFor="ds-input-default">Razón social</Label>
              <Input id="ds-input-default" placeholder="Boeltech SA de CV" />
            </div>
          </FormRow>
          <FormRow label="Con valor">
            <div className="space-y-1.5">
              <Label htmlFor="ds-input-value">RFC</Label>
              <Input
                id="ds-input-value"
                defaultValue="BOEL920101AB1"
                className="font-mono"
              />
            </div>
          </FormRow>
          <FormRow label="Error">
            <div className="space-y-1.5">
              <Label htmlFor="ds-input-error">Email</Label>
              <Input
                id="ds-input-error"
                error
                defaultValue="no-es-email"
                aria-invalid="true"
                aria-describedby="ds-input-error-msg"
              />
              <p
                id="ds-input-error-msg"
                className="text-xs text-destructive"
              >
                Ingresa un email válido
              </p>
            </div>
          </FormRow>
          <FormRow label="Disabled">
            <div className="space-y-1.5">
              <Label htmlFor="ds-input-disabled">UUID (solo lectura)</Label>
              <Input
                id="ds-input-disabled"
                disabled
                defaultValue="A1B2C3D4-E5F6-7890"
                className="font-mono"
              />
            </div>
          </FormRow>
        </CardContent>
      </Card>

      {/* Textarea */}
      <Card>
        <CardHeader>
          <CardTitle>Textarea</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ds-textarea-default">Notas internas</Label>
            <Textarea
              id="ds-textarea-default"
              placeholder="Escribe aquí las observaciones del viaje…"
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ds-textarea-disabled">Comentarios (cerrados)</Label>
            <Textarea
              id="ds-textarea-disabled"
              disabled
              rows={4}
              defaultValue="Viaje completado sin incidentes. Conductor entregó documentación física en oficina."
            />
          </div>
        </CardContent>
      </Card>

      {/* Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ds-select-status">Estado del viaje</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger id="ds-select-status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="in_progress">En ruta</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds-select-disabled">Tipo de vehículo</Label>
              <Select disabled>
                <SelectTrigger id="ds-select-disabled">
                  <SelectValue placeholder="Cargando catálogo…" />
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkbox + Switch */}
      <Card>
        <CardHeader>
          <CardTitle>Checkbox & Switch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRow label="Checkbox">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ds-cb-1"
                  checked={checked}
                  onCheckedChange={setChecked}
                />
                <Label htmlFor="ds-cb-1">Acepto los términos y condiciones</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ds-cb-2" />
                <Label htmlFor="ds-cb-2">
                  Notificarme por correo cuando el viaje cambie de estado
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ds-cb-3" disabled defaultChecked />
                <Label htmlFor="ds-cb-3" className="opacity-50">
                  Cliente verificado (no editable)
                </Label>
              </div>
            </div>
          </FormRow>
          <FormRow label="Switch">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Modo oscuro automático</p>
                  <p className="text-xs text-muted-foreground">
                    Sigue la preferencia del sistema operativo
                  </p>
                </div>
                <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-3 opacity-60">
                <div>
                  <p className="text-sm font-medium">
                    Sincronizar a Google Calendar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requiere conectar tu cuenta primero
                  </p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </FormRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fecha y hora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRow label="Solo fecha">
            <div className="space-y-1.5">
              <Label htmlFor="ds-date-field">Vencimiento</Label>
              <DateField
                id="ds-date-field"
                value={civilDate}
                onChange={setCivilDate}
              />
            </div>
          </FormRow>
          <FormRow label="Fecha y hora">
            <div className="space-y-1.5">
              <Label htmlFor="ds-datetime-field">Salida programada</Label>
              <DateTimeField
                id="ds-datetime-field"
                value={instant}
                onChange={setInstant}
                defaultTimeOnDateSelect="08:00"
                presets={[
                  { label: "Hoy 08:00", value: "2026-03-10T08:00" },
                  { label: "Mañana 08:00", value: "2026-03-11T08:00" },
                ]}
              />
            </div>
          </FormRow>
        </CardContent>
      </Card>
    </div>
  );
}

interface FormRowProps {
  label: string;
  children: React.ReactNode;
}

function FormRow({ label, children }: FormRowProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-start">
      <p className="text-xs uppercase tracking-wider text-muted-foreground sm:pt-2">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}
