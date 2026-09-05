import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { useDebounce } from "@shared/hooks";
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
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { BranchStatus, useBranch, useBranches } from "@features/branches";
import type { BranchListItem } from "@features/branches";
import { branchAsyncComboboxCopy } from "./branchAsyncComboboxCopy";

const copy = branchAsyncComboboxCopy;

export interface BranchAsyncComboboxProps {
  value: string;
  onChange: (branchId: string) => void;
  disabled?: boolean;
  excludeIds?: string[];
  placeholder?: string;
  id?: string;
  label?: string;
  error?: string;
  limit?: number;
  className?: string;
  allowClear?: boolean;
}

function formatBranchLabel(branch: Pick<BranchListItem, "code" | "name">): string {
  return `${branch.code} — ${branch.name}`;
}

export function BranchAsyncCombobox({
  value,
  onChange,
  disabled = false,
  excludeIds = [],
  placeholder,
  id = "branch-async-combobox",
  label,
  error,
  limit = 20,
  className,
  allowClear = false,
}: BranchAsyncComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: branchesData, isLoading, isError } = useBranches({
    page: 1,
    limit,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
      search: debouncedSearch.trim() || undefined,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const { data: selectedBranchDetail } = useBranch(value);

  const branches = useMemo(() => {
    const exclude = new Set(excludeIds);
    return (branchesData?.data ?? []).filter((branch) => !exclude.has(branch.id));
  }, [branchesData?.data, excludeIds]);

  const selectedFromList = useMemo(() => {
    if (!value) return null;
    return branches.find((branch) => branch.id === value) ?? null;
  }, [branches, value]);

  const selectedBranch =
    selectedFromList ??
    (selectedBranchDetail
      ? {
          id: selectedBranchDetail.id,
          code: selectedBranchDetail.code,
          name: selectedBranchDetail.name,
        }
      : null);

  const triggerLabel = useMemo(() => {
    if (!selectedBranch) return placeholder ?? copy.placeholder;
    return formatBranchLabel(selectedBranch);
  }, [placeholder, selectedBranch]);

  const handleSelect = (branchId: string) => {
    onChange(branchId === value ? "" : branchId);
    setOpen(false);
    setSearchQuery("");
  };

  const combobox = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={copy.ariaLabel}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left",
            !value && "text-muted-foreground",
            error && "border-destructive",
            className,
          )}
          {...getFieldErrorAriaProps(id, error)}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(400px,90vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={copy.searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.loading}
              </div>
            ) : isError ? (
              <div className="py-6 text-center text-sm text-destructive">{copy.loadError}</div>
            ) : branches.length === 0 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{copy.empty}</p>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {branches.map((branch) => {
                  const isSelected = branch.id === value;
                  return (
                    <CommandItem
                      key={branch.id}
                      value={branch.id}
                      onSelect={() => handleSelect(branch.id)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{branch.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{branch.code}</p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const clearButton =
    allowClear && value ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-muted-foreground"
        onClick={() => onChange("")}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        {copy.clear}
      </Button>
    ) : null;

  if (!label) {
    return (
      <div className="space-y-1">
        {combobox}
        {clearButton}
      </div>
    );
  }

  return (
    <FormFieldShell fieldId={id} label={label} errorMessage={error}>
      <div className="space-y-1">
        {combobox}
        {clearButton}
      </div>
    </FormFieldShell>
  );
}
