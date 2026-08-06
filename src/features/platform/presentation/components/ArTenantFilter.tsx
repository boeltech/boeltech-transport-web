import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  usePlatformTenant,
  usePlatformTenants,
} from "../../application/hooks/usePlatformTenants";
import { platformCopy } from "../copy/platformCopy";

interface ArTenantFilterProps {
  value: string;
  onChange: (tenantId: string) => void;
}

export function ArTenantFilter({ value, onChange }: ArTenantFilterProps) {
  const copy = platformCopy.ar.filters;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: listData, isFetching } = usePlatformTenants({
    search: search.trim() || undefined,
    limit: 25,
    page: 1,
  });

  const { data: selectedTenant } = usePlatformTenant(value);

  const tenants = listData?.data ?? [];

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    if (selectedTenant) {
      return `${selectedTenant.name} (${selectedTenant.subdomain})`;
    }
    const fromList = tenants.find((t) => t.id === value);
    if (fromList) return `${fromList.name} (${fromList.subdomain})`;
    return null;
  }, [value, selectedTenant, tenants]);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            aria-label={copy.tenant}
            className={cn(
              "h-9 w-[220px] justify-between font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {selectedLabel ?? copy.tenantPlaceholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={copy.tenantPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isFetching ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando…
                </div>
              ) : (
                <>
                  <CommandEmpty>{copy.tenantEmpty}</CommandEmpty>
                  <CommandGroup>
                    {tenants.map((tenant) => (
                      <CommandItem
                        key={tenant.id}
                        value={tenant.id}
                        onSelect={() => {
                          onChange(tenant.id === value ? "" : tenant.id);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === tenant.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">
                          {tenant.name}
                          <span className="ml-1 text-muted-foreground">
                            ({tenant.subdomain})
                          </span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={copy.tenantClear}
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
