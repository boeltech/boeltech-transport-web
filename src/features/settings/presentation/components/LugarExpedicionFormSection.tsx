import type { ReactNode } from "react";
import { Receipt } from "lucide-react";

import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import type { EntityAddressFormSection } from "@shared/ui/address-input";

export const LUGAR_EXPEDICION_SECTION_ID = "lugar-expedicion-cfdi";

export const LUGAR_EXPEDICION_HINT =
  "Código postal del lugar de expedición de facturas (atributo LugarExpedicion en CFDI 4.0).";

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
  return "Lugar de expedición (CFDI)";
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
      <p className="text-sm text-muted-foreground">{LUGAR_EXPEDICION_HINT}</p>

      <div className="flex items-center gap-2">
        <Switch
          id="expideDesdeOtroCp"
          checked={Boolean(expideDesdeOtroCp)}
          disabled={disabled}
          onCheckedChange={onExpideDesdeOtroCpChange}
        />
        <Label htmlFor="expideDesdeOtroCp" className="cursor-pointer text-sm font-normal">
          Expido desde otro código postal
        </Label>
      </div>

      {expideDesdeOtroCp ? (
        <div className="space-y-2">
          <Label htmlFor="lugarExpedicion">
            Código postal de expedición <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lugarExpedicion"
            placeholder="03100"
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
            Se usará el mismo CP del domicilio fiscal:{" "}
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

/** Misma presentación que «Ubicación en mapa»: `FormSectionCard` vía `EntityAddressForm`. */
export function buildLugarExpedicionEntityFormSection(
  props: LugarExpedicionSectionContentProps,
): EntityAddressFormSection {
  return {
    id: LUGAR_EXPEDICION_SECTION_ID,
    title: <LugarExpedicionSectionTitle />,
    icon: <Receipt className="h-4 w-4" />,
    contentClassName: "space-y-4",
    content: <LugarExpedicionSectionContent {...props} />,
  };
}
