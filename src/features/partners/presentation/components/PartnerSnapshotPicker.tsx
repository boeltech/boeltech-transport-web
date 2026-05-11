/**
 * Búsqueda en catálogo de partners + alta rápida para rellenar RFC/nombre (snapshot).
 */

import { useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/ui/popover";
import { useDebounce } from "@shared/hooks/use-debounce";
import { cn } from "@shared/lib/utils/cn";

import type { Partner } from "../../domain/entities";
import { usePartnersSearch } from "../../application/hooks/usePartnersSearch";
import { useCreatePartner } from "../../application/hooks/useCreatePartner";

export interface PartnerSnapshotPickerProps {
  disabled?: boolean;
  variant?: "remitente" | "destinatario";
  onPartnerApplied: (partner: Partner) => void;
  className?: string;
}

export function PartnerSnapshotPicker({
  disabled,
  variant = "remitente",
  onPartnerApplied,
  className,
}: PartnerSnapshotPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 320);
  const { data: results = [], isFetching } = usePartnersSearch(debounced);

  const createMutation = useCreatePartner();
  const [draftLegalName, setDraftLegalName] = useState("");
  const [draftTaxId, setDraftTaxId] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleApply = (p: Partner) => {
    onPartnerApplied(p);
    setOpen(false);
    setQuery("");
    setShowCreate(false);
  };

  const handleQuickCreate = async () => {
    const legalName = draftLegalName.trim();
    const taxId = draftTaxId.trim().toUpperCase();
    if (!legalName || !taxId) return;
    const created = await createMutation.mutateAsync({ legalName, taxId });
    handleApply(created);
    setDraftLegalName("");
    setDraftTaxId("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("gap-1.5", className)}
        >
          <Search className="h-3.5 w-3.5" />
          Partner ({variant === "remitente" ? "remitente" : "destinatario"})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,22rem)] space-y-3 p-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">Buscar por RFC o razón social</Label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mínimo 2 caracteres…"
            autoComplete="off"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-md border">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              {debounced.length < 2
                ? "Escribe al menos 2 caracteres."
                : "Sin resultados. Puedes dar de alta abajo."}
            </p>
          ) : (
            <ul className="divide-y">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/80"
                    onClick={() => handleApply(p)}
                  >
                    <span className="font-medium leading-tight">{p.legalName}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.taxId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t pt-2">
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-primary"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            Alta rápida de partner
          </button>
          {showCreate && (
            <div className="space-y-2 rounded-md bg-muted/40 p-2">
              <Input
                placeholder="Razón social"
                value={draftLegalName}
                onChange={(e) => setDraftLegalName(e.target.value)}
              />
              <Input
                placeholder="RFC"
                className="uppercase"
                maxLength={13}
                value={draftTaxId}
                onChange={(e) => setDraftTaxId(e.target.value.toUpperCase())}
              />
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={createMutation.isPending}
                onClick={() => void handleQuickCreate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar y aplicar"
                )}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
