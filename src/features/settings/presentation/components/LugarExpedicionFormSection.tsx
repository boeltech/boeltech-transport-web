import type { ReactNode } from "react";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";

export const LUGAR_EXPEDICION_SECTION_ID = "lugar-expedicion-cfdi";

const copy = generalSettingsCopy.expedition;

export interface LugarExpedicionSectionContentProps {
  expideDesdeOtroCp: boolean;
  fiscalPostalCode?: string;
  lugarExpedicionError?: string;
  fiscalPostalCodeError?: string;
  disabled?: boolean;
  onExpideDesdeOtroCpChange: (checked: boolean) => void;
  lugarExpedicionRegister: React.ComponentProps<"input">;
}

export function LugarExpedicionSectionTitle(): ReactNode {
  return copy.sectionTitle;
}

export function LugarExpedicionSectionContent({
  expideDesdeOtroCp,
  fiscalPostalCode,
  lugarExpedicionError,
  fiscalPostalCodeError,
  disabled = false,
  onExpideDesdeOtroCpChange,
  lugarExpedicionRegister,
}: LugarExpedicionSectionContentProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground">{copy.hint}</p>

      <div className="flex items-center gap-2">
        <Switch
          id="expideDesdeOtroCp"
          checked={Boolean(expideDesdeOtroCp)}
          disabled={disabled}
          onCheckedChange={onExpideDesdeOtroCpChange}
        />
        <Label htmlFor="expideDesdeOtroCp" className="cursor-pointer text-sm font-normal">
          {copy.toggle}
        </Label>
      </div>

      {expideDesdeOtroCp ? (
        <div className="space-y-2">
          <Label htmlFor="lugarExpedicion">
            {copy.fieldLabel}
            <span className="text-destructive"> *</span>
          </Label>
          <Input
            id="lugarExpedicion"
            placeholder={copy.fieldPlaceholder}
            maxLength={5}
            inputMode="numeric"
            className="w-40"
            disabled={disabled}
            error={Boolean(lugarExpedicionError)}
            {...lugarExpedicionRegister}
            {...getFieldErrorAriaProps("lugarExpedicion", lugarExpedicionError)}
          />
          <FieldInlineError
            fieldId="lugarExpedicion"
            message={lugarExpedicionError}
          />
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {copy.sameAsAddress}{" "}
            <span className="font-medium text-foreground tabular-nums">
              {fiscalPostalCode?.length === 5 ? fiscalPostalCode : "—"}
            </span>
          </p>
          <FieldInlineError
            fieldId="fiscal-postal-code"
            message={fiscalPostalCodeError}
          />
        </div>
      )}
    </>
  );
}
