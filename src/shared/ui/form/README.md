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

## Guías y checklist PR

- Campos y resumen de errores: `D:\cowork\boeltech\erp-transport\docs\design-system\form-validation-pattern.md`
- Arquitectura wizard (`WizardPageShell`, `WizardFormRef`): `src/shared/ui/page-shells/README.md`
- Long-form: `.agents/skills/design-system/SKILL.md` § Formularios largos

## Tests

`formValidationUx.test.tsx` — contrato RTL: borde `border-destructive`, `#fieldId-error`, ARIA y `RHFTextField` tras submit inválido.

```bash
npm run test -- src/shared/ui/form/formValidationUx.test.tsx
```
