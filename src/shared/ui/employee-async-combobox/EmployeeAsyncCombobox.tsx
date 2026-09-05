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
import { Checkbox } from "@shared/ui/checkbox";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { useEmployees, useEmployeeBasic } from "@features/employees";
import type { EmployeeListItem } from "@features/employees";
import { employeeAsyncComboboxCopy } from "./employeeAsyncComboboxCopy";

const copy = employeeAsyncComboboxCopy;

type EmployeeAsyncComboboxBaseProps = {
  disabled?: boolean;
  excludeIds?: string[];
  placeholder?: string;
  id?: string;
  label?: string;
  error?: string;
  isActive?: boolean;
  limit?: number;
  className?: string;
};

type EmployeeAsyncComboboxSingleProps = EmployeeAsyncComboboxBaseProps & {
  mode?: "single";
  value: string;
  onChange: (employeeId: string) => void;
  allowClear?: boolean;
};

type EmployeeAsyncComboboxMultiProps = EmployeeAsyncComboboxBaseProps & {
  mode: "multi";
  value: string[];
  onChange: (employeeIds: string[]) => void;
};

export type EmployeeAsyncComboboxProps =
  | EmployeeAsyncComboboxSingleProps
  | EmployeeAsyncComboboxMultiProps;

function formatEmployeeLabel(employee: Pick<EmployeeListItem, "firstName" | "lastName" | "employeeNumber">): string {
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return employee.employeeNumber ? `${employee.employeeNumber} — ${name}` : name;
}

export function EmployeeAsyncCombobox(props: EmployeeAsyncComboboxProps) {
  const {
    disabled = false,
    excludeIds = [],
    placeholder,
    id = "employee-async-combobox",
    label,
    error,
    isActive = true,
    limit = 20,
    className,
  } = props;

  const isMulti = props.mode === "multi";
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: employeesData, isLoading, isError } = useEmployees({
    search: debouncedSearch.trim() || undefined,
    limit,
    isActive,
  });

  const singleValue = !isMulti ? props.value : "";
  const { data: selectedBasic } = useEmployeeBasic(singleValue, !isMulti && Boolean(singleValue));

  const employees = useMemo(() => {
    const exclude = new Set(excludeIds);
    return (employeesData?.data ?? []).filter((employee) => !exclude.has(employee.id));
  }, [employeesData?.data, excludeIds]);

  const selectedFromList = useMemo(() => {
    if (isMulti || !singleValue) return null;
    return employees.find((employee) => employee.id === singleValue) ?? null;
  }, [employees, isMulti, singleValue]);

  const selectedEmployee = selectedFromList ?? selectedBasic ?? null;

  const triggerLabel = useMemo(() => {
    if (isMulti) {
      const count = props.value.length;
      if (count === 0) return placeholder ?? copy.multiPlaceholder;
      return copy.multiSummary(count);
    }
    if (!selectedEmployee) return placeholder ?? copy.placeholder;
    return formatEmployeeLabel(selectedEmployee);
  }, [isMulti, placeholder, props, selectedEmployee]);

  const toggleMulti = (employeeId: string, checked: boolean) => {
    if (!isMulti) return;
    const current = new Set(props.value);
    if (checked) current.add(employeeId);
    else current.delete(employeeId);
    props.onChange([...current]);
  };

  const handleSingleSelect = (employeeId: string) => {
    if (isMulti) return;
    props.onChange(employeeId === props.value ? "" : employeeId);
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
          aria-label={isMulti ? copy.ariaLabelMulti : copy.ariaLabel}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left",
            !isMulti && !singleValue && "text-muted-foreground",
            isMulti && props.value.length === 0 && "text-muted-foreground",
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
            ) : employees.length === 0 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{copy.empty}</p>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {employees.map((employee) => {
                  const isSelected = isMulti
                    ? props.value.includes(employee.id)
                    : employee.id === singleValue;

                  return (
                    <CommandItem
                      key={employee.id}
                      value={employee.id}
                      onSelect={() => {
                        if (isMulti) toggleMulti(employee.id, !isSelected);
                        else handleSingleSelect(employee.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      {isMulti ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleMulti(employee.id, checked === true)
                          }
                          aria-label={formatEmployeeLabel(employee)}
                        />
                      ) : (
                        <Check
                          className={cn(
                            "h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {employee.employeeNumber
                            ? `No. ${employee.employeeNumber}`
                            : employee.position ?? "Operador"}
                        </p>
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

  const clearSingle =
    !isMulti && props.allowClear && singleValue ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-muted-foreground"
        onClick={() => props.onChange("")}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        {copy.clear}
      </Button>
    ) : null;

  if (!label) {
    return (
      <div className="space-y-1">
        {combobox}
        {clearSingle}
      </div>
    );
  }

  return (
    <FormFieldShell fieldId={id} label={label} errorMessage={error}>
      <div className="space-y-1">
        {combobox}
        {clearSingle}
      </div>
    </FormFieldShell>
  );
}
