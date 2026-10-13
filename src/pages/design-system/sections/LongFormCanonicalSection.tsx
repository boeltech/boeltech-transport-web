/**
 * LongFormCanonicalSection
 *
 * Demo viva del formulario largo (F3 / D5–D6–D11):
 * LongFormSectionNav + LongFormEditLayout + FormStickyActions + aviso unsaved.
 *
 * Canónico en producto: /vehicles/:id/edit
 */

import { useMemo, useState } from "react";
import {
  FileText,
  Gauge,
  Settings,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  FormStickyActions,
  LongFormEditLayout,
  LongFormSectionNav,
  UnsavedChangesDialog,
  type LongFormSectionItem,
} from "@shared/ui/form";
import { UNSAVED_CHANGES_COPY } from "@shared/hooks/useUnsavedChangesGuard";

const SECTIONS: LongFormSectionItem[] = [
  { id: "demo-identity", label: "Identificación", icon: Truck },
  { id: "demo-specs", label: "Características", icon: Settings },
  { id: "demo-capacity", label: "Capacidades", icon: Gauge },
  { id: "demo-docs", label: "Documentación", icon: ShieldCheck },
  { id: "demo-cp", label: "Carta Porte", icon: FileText },
];

export function LongFormCanonicalSection() {
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);
  const [unitLabel, setUnitLabel] = useState("U-100");
  const [plate, setPlate] = useState("ABC-123-A");
  const [savedSnapshot, setSavedSnapshot] = useState({
    unitLabel: "U-100",
    plate: "ABC-123-A",
  });
  const [previewUnsaved, setPreviewUnsaved] = useState(false);
  const [errorOnDocs, setErrorOnDocs] = useState(false);

  const isDirty =
    unitLabel !== savedSnapshot.unitLabel || plate !== savedSnapshot.plate;

  const errorCountBySection = useMemo(
    () => ({
      "demo-docs": errorOnDocs ? 1 : 0,
    }),
    [errorOnDocs],
  );

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = () => {
    setSavedSnapshot({ unitLabel, plate });
  };

  const handleReset = () => {
    setUnitLabel(savedSnapshot.unitLabel);
    setPlate(savedSnapshot.plate);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formulario largo (edit)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Patrón canónico para edición padre en{" "}
            <code className="font-mono text-xs">FormPageShell</code>: rail de
            secciones, pie sticky y aviso al salir con cambios sin guardar.
          </p>
          <p>
            Producto:{" "}
            <code className="font-mono text-xs">/vehicles/:id/edit</code>.
            Primitivos:{" "}
            <code className="font-mono text-xs">FormStickyActions</code>,{" "}
            <code className="font-mono text-xs">LongFormSectionNav</code>,{" "}
            <code className="font-mono text-xs">useUnsavedChangesGuard</code>.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isDirty ? "warning" : "success"} tone="soft">
              {isDirty ? "Dirty" : "Limpio"}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setErrorOnDocs((v) => !v)}
            >
              {errorOnDocs ? "Quitar error en Documentación" : "Simular error en Documentación"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPreviewUnsaved(true)}
              disabled={!isDirty}
            >
              Vista previa aviso unsaved
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <LongFormEditLayout
            nav={
              <LongFormSectionNav
                sections={SECTIONS}
                activeSectionId={activeSectionId}
                errorCountBySection={errorCountBySection}
                onSelectSection={handleSelectSection}
                title="Secciones"
              />
            }
          >
            <div id="demo-identity" className="scroll-mt-28 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Identificación
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-unit">Unidad</Label>
                  <Input
                    id="demo-unit"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-plate">Placa</Label>
                  <Input
                    id="demo-plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div id="demo-specs" className="scroll-mt-28 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Características
              </h3>
              <p className="text-sm text-muted-foreground">
                Bloque de ejemplo (marca, modelo, año…).
              </p>
            </div>

            <div id="demo-capacity" className="scroll-mt-28 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Capacidades
              </h3>
              <p className="text-sm text-muted-foreground">
                Campos opcionales densos; el rail no exige scroll al fondo.
              </p>
            </div>

            <div id="demo-docs" className="scroll-mt-28 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Documentación
              </h3>
              <p className="text-sm text-muted-foreground">
                {errorOnDocs
                  ? "Hay un error de ejemplo: el rail muestra el indicador destructivo."
                  : "Sin errores en esta sección."}
              </p>
            </div>

            <div id="demo-cp" className="scroll-mt-28 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Carta Porte
              </h3>
              <p className="text-sm text-muted-foreground">
                Datos SAT / autotransporte (demo).
              </p>
            </div>
          </LongFormEditLayout>

          <FormStickyActions sticky>
            <Button type="button" variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isDirty}>
              Guardar cambios
            </Button>
          </FormStickyActions>
        </form>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Unsaved guard (D11)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            En producto,{" "}
            <code className="font-mono text-xs">useUnsavedChangesGuard</code>{" "}
            bloquea navegación del data router y{" "}
            <code className="font-mono text-xs">beforeunload</code>. El diálogo
            usa el copy canónico:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>{UNSAVED_CHANGES_COPY.title}</li>
            <li>{UNSAVED_CHANGES_COPY.description}</li>
          </ul>
          <p>
            Marca el form dirty arriba y usa «Vista previa aviso unsaved» para
            ver el mismo diálogo sin salir de esta página.
          </p>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={previewUnsaved}
        onConfirm={() => {
          handleReset();
          setPreviewUnsaved(false);
        }}
        onDismiss={() => setPreviewUnsaved(false)}
      />
    </div>
  );
}
