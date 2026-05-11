/**
 * Paleta de navegación rápida (⌘K / Ctrl+K).
 * Usa la misma navegación filtrada que el sidebar (`useNavigation`), así RBAC
 * y reglas por rol (p. ej. Finanzas vs Facturas) permanecen alineadas con la API.
 */

import {
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";

import { useNavigation } from "@widgets/sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { DialogTitle } from "@shared/ui/dialog";

export interface GlobalCommandMenuProps {
  open: boolean;
  /** Comparte estado con el padre; permite toggle ⌘K con actualizador funcional. */
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function GlobalCommandMenu({
  open,
  onOpenChange,
}: GlobalCommandMenuProps) {
  const navigate = useNavigate();
  const { navigation } = useNavigation();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const runNavigate = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Navegación rápida</DialogTitle>
      <CommandInput placeholder="Ir a página…" />
      <CommandList>
        <CommandEmpty>Sin coincidencias.</CommandEmpty>
        {navigation.map((group) => (
          <CommandGroup
            key={group.id}
            heading={group.title.trim().length > 0 ? group.title : undefined}
          >
            {group.items
              .filter((item) => !item.disabled)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`${group.id}-${item.id}`}
                    value={`${item.label} ${group.title} ${item.path}`}
                    onSelect={() => runNavigate(item.path)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
