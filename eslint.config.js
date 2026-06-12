import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/features/**/presentation/pages/**/*Page*.{ts,tsx}'],
    rules: {
      // Guardrail Fase 3: las pages deben consumir shells, no primitivas wizard.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@shared/ui/wizard',
              message:
                'Importa WizardPageShell desde @shared/ui/page-shells en pages. Si necesitas una excepcion, documentala en el PR.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/finance/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/invoicing/*'],
              message:
                'Finance no debe importar de invoicing. Si necesitas un tipo o hook compartido, muevelo a @shared o al feature finance.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/invoicing/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/finance/*'],
              message: 'Invoicing no debe importar de finance.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.*',
      '**/uiHelpers.ts',
      '**/ComponentsSection.tsx',
      '**/CatalogTypeCard.tsx',
      '**/TripDetailPage.tsx',
      '**/CargoStep.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(bg|text|border)-(red|blue|green|yellow|amber|emerald|gray|slate|white)-\\d/]',
          message:
            'Usa tokens del design system (p. ej. bg-destructive-soft, text-warning) en lugar de colores Tailwind crudos.',
        },
        {
          selector:
            'TemplateElement[value.raw=/\\b(bg|text|border)-(red|blue|green|yellow|amber|emerald|gray|slate|white)-\\d/]',
          message:
            'Usa tokens del design system (p. ej. bg-destructive-soft, text-warning) en lugar de colores Tailwind crudos.',
        },
      ],
    },
  },
])
