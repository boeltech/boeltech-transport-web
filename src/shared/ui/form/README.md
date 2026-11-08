# Formularios compartidos (`@shared/ui/form`)

Primitivos para validación UX en formularios y wizards de alta (conductores, vehículos, clientes, empleados, viajes, etc.).

| Export | Uso |
|--------|-----|
| `FieldInlineError` | Mensaje bajo el campo (`text-xs text-destructive`, id `{fieldId}-error`) |
| `getFieldErrorAriaProps` | `aria-invalid` + `aria-describedby` |
| `getRegisterFieldErrorProps` | `error` + ARIA para campos con `register()` (auth, invitaciones) |
| `normalizeRequiredFieldLabel` | Evita `*` duplicado en label + `required` |
| `FormFieldShell` | Label + slot del control + ayuda + error inline |
| `FormValidationSummary` | Alert con lista tras `trigger()` fallido |
| `FormStickyActions` | Pie sticky Cancelar/Guardar en forms largos (edit) |
| `LongFormSectionNav` / `LongFormEditLayout` | Rail de secciones + grid edit long-form |
| `UnsavedChangesDialog` | Confirmación al salir con cambios dirty (D11) |
| `RHFSelect` | Select controlado con borde de error y ARIA |
| `RHFTextField` | Input + label + error (Controller) |
| `MoneyInput` | Captura de montos con prefijo MXN y formato moneda |
| `RHFMoneyField` | MoneyInput + label + error (Controller) |
| `RHFTextareaField` | Textarea + label + error |
| `RHFSelectField` | Select con opciones `{ value, label }` |
| `RHFCatalogField` | Catálogo SAT con error + ARIA |

## Formularios largos (edit)

| Primitivo | Uso |
|-----------|-----|
| `FormStickyActions` | Pie sticky Cancelar/Guardar (desktop: visible sin scroll al fondo) |
| `LongFormSectionNav` | Rail de secciones con badge de errores |
| `LongFormEditLayout` | Grid `280px + 1fr` (rail + canvas) |
| `useUnsavedChangesGuard` (`@shared/hooks`) | Bloqueo navegación + `beforeunload` si dirty |
| `UnsavedChangesDialog` | Diálogo de confirmación (blocker o modo controlado para demos) |

Canónico: `EditVehiclePage` / `CreateVehiclePage` (wizard dirty). Branch: `FormStickyActions`. Employee: adapters sobre `LongFormSectionNav` / `LongFormEditLayout`. Demo: `/design-system` → Form largo.

## Contrato UX de validación

Intención de producto: SoT `design/tlamx/patterns/forms-intent.md`. Contrato de implementación:

1. **RHF + Zod** con `zodResolver`; `mode: "onChange"` en formularios largos.
2. Al validar paso o guardar: `await trigger(undefined, { shouldFocus: true })`.
3. Cada campo con error:
   - `error={Boolean(fieldState.error)}` en `Input` / `SelectTrigger` / `Textarea` / `CatalogSelect`.
   - `FieldInlineError` con `fieldId` estable (= `id` del control) → `#fieldId-error`, `text-xs text-destructive`.
   - `getFieldErrorAriaProps(fieldId, message)` en el control, o `getRegisterFieldErrorProps` con `register()`.
4. Tras el primer `trigger` fallido: `FormValidationSummary` al **pie** del formulario (título contextual en wizards).
5. No duplicar el mismo error en banner global y bajo el campo (direcciones: `addressFormNoticeRules`).
6. Domicilios SAT: UX en `addressFormUx` + contrato `@boeltech/cfdi-domain` vía `addressPayloadBridge` (ADR-0043).

Wizards (`WizardPageShell`, `WizardFormRef`, sin toast en «Siguiente»): `src/shared/ui/page-shells/README.md`.
Long-form: `.agents/skills/design-system/SKILL.md` § Formularios largos.

### Recetas

Campo con `register()` (auth, invitaciones):

```tsx
import { FieldInlineError, getRegisterFieldErrorProps } from "@shared/ui/form";

<Label htmlFor="email">Correo electrónico</Label>
<Input id="email" type="email" {...register("email")}
  {...getRegisterFieldErrorProps("email", errors.email?.message)} />
<FieldInlineError fieldId="email" message={errors.email?.message} />
```

Campo con `Controller` → preferir `RHFTextField` (`control`, `name`, `label`). Equivalente manual:

```tsx
<Input id="legalName" error={Boolean(errors.legalName)} {...register("legalName")}
  {...getFieldErrorAriaProps("legalName", errors.legalName?.message)} />
<FieldInlineError fieldId="legalName" message={errors.legalName?.message} />
```

Select controlado:

```tsx
<Controller name="paymentTerms" control={control}
  render={({ field, fieldState }) => (
    <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
      <SelectTrigger id="paymentTerms" error={Boolean(fieldState.error)}
        {...getFieldErrorAriaProps("paymentTerms", fieldState.error?.message)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>…</SelectContent>
    </Select>
  )} />
<FieldInlineError fieldId="paymentTerms" message={errors.paymentTerms?.message} />
```

Resumen de errores:

```tsx
const [showValidationSummary, setShowValidationSummary] = useState(false);
const validationMessages = collectFieldErrorMessages(errors); // @shared/utils/formErrors

const runValidation = useCallback(async () => {
  const ok = await trigger(undefined, { shouldFocus: true });
  setShowValidationSummary(!ok);
  return ok;
}, [trigger]);

{showValidationSummary && !isValid ? (
  <FormValidationSummary messages={validationMessages} title="Revisa la información del cliente" />
) : null}
```

Domicilio con contrato CP31 (segunda pasada SAT, solo si el form persiste domicilio):

```tsx
const satResult = await validateClientAddressFormComplete(snapshot, {
  context: "billingOnCreate",
  requireCoordinates: false,
});
if (!satResult.ok) {
  applySatFieldErrors(satResult.fieldErrors);
  return false;
}
```

Piezas fuera de este módulo: `@shared/utils/formErrors` (`collectFieldErrorMessages`) ·
`@shared/validation/addressFormUx` · `@shared/cfdi/addressPayloadBridge` · `@shared/ui/address-input`.

## Checklist PR (formularios)

- [ ] `error` + ARIA (`getFieldErrorAriaProps` / `getRegisterFieldErrorProps`) en controles editables
- [ ] `FieldInlineError` bajo cada campo con error (`text-xs`, id `{fieldId}-error`)
- [ ] Wizards: `trigger(..., { shouldFocus: true })` + `FormValidationSummary` tras fallo; **sin toast** en «Siguiente»
- [ ] Sin `FormMessage` de shadcn mezclado con el patrón en el mismo formulario
- [ ] Sin `<p className="text-sm text-destructive">` manual bajo campos
- [ ] Domicilios: segunda pasada SAT vía paquete (`addressPayloadBridge`), sin reglas duplicadas

## Anti-patrones

- Asterisco duplicado: `label="Campo *"` **y** `required` (el shell ya añade `*`; usar solo `required` o `normalizeRequiredFieldLabel`).
- Banner rojo global que repite «Estado, Código postal» cuando ya hay `FieldInlineError`.
- Validar SAT solo en UI local duplicando reglas del paquete.
- Toast al fallar **Siguiente** en wizard.

## Tests

`formValidationUx.test.tsx` — contrato RTL: borde `border-destructive`, `#fieldId-error`, ARIA y `RHFTextField` tras submit inválido.

```bash
npm run test -- src/shared/ui/form/formValidationUx.test.tsx
```
