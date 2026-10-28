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
    rules: {
      // F4b sprint-cero-seguridad (CEO 2026-10-16, opción 1): deuda histórica a warn.
      // Baseline congelado en package.json --max-warnings; cleanup futuro puede restaurar error.
      'no-unused-labels': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['src/features/**/presentation/pages/**/*Page*.{ts,tsx}'],
    rules: {
      // Guardrail Fase 3: las pages deben consumir shells, no primitivas wizard.
      // warn (no error) hasta cleanup pedido — ver F4b baseline.
      'no-restricted-imports': [
        'warn',
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
        'warn',
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
        'warn',
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
    // Ops DS Ola 0 — frontera dura vs DS ERP (DS-D1 / TEC §F). Allowlist: ops/ui/**
    // Showcase L3: design-system/** puede importar contrast* (bloque siguiente).
    files: ['src/features/platform/presentation/ops/**/*.{ts,tsx}'],
    ignores: [
      'src/features/platform/presentation/ops/ui/**/*.{ts,tsx}',
      'src/features/platform/presentation/ops/design-system/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@shared/ui/card',
              message:
                'Ops: usa OpsPanel desde ops/ui (no Card ERP).',
            },
            {
              name: '@shared/ui/badge',
              message:
                'Ops: usa OpsBadge desde ops/ui (no Badge ERP).',
            },
            {
              name: '@shared/ui/table',
              message:
                'Ops: usa OpsTable desde ops/ui (no Table ERP).',
            },
            {
              name: '@shared/ui/button',
              message:
                'Ops: usa OpsButton desde ops/ui (no Button ERP).',
            },
            {
              name: '@shared/ui/sheet',
              message:
                'Ops: usa OpsSheet desde ops/ui (no Sheet ERP).',
            },
            {
              name: '@shared/ui/dialog',
              message:
                'Ops: usa OpsDialog desde ops/ui (no Dialog ERP).',
            },
            {
              name: '@shared/ui/tabs',
              message:
                'Ops: no montar Tabs ERP; patrón ops en oleada posterior.',
            },
            {
              name: '@shared/ui/page-shells',
              message:
                'Ops: no usar page-shells ERP bajo .platform-ops.',
            },
            {
              name: '@shared/ui/theme',
              message:
                'Ops: tema aislado (opsTheme / OpsThemeProvider). No importar ThemeCycle ERP.',
            },
          ],
          patterns: [
            {
              group: [
                '@shared/ui/card/*',
                '@shared/ui/badge/*',
                '@shared/ui/table/*',
                '@shared/ui/button/*',
                '@shared/ui/sheet/*',
                '@shared/ui/dialog/*',
                '@shared/ui/tabs/*',
                '@shared/ui/page-shells/*',
                '@shared/ui/theme/*',
              ],
              message:
                'Ops: consumir primitivos ops/ui (no look Conform ERP).',
            },
            {
              group: [
                '@/pages/design-system',
                '@/pages/design-system/*',
                '**/pages/design-system/**',
              ],
              message:
                'Ops: no importar ERP /design-system (FOUND-D9). Showcase en ops/design-system.',
            },
          ],
        },
      ],
    },
  },
  {
    // L3 — showcase puede usar contrastCompute / contrastPairs; sigue vedado ThemeCycle.
    files: [
      'src/features/platform/presentation/ops/design-system/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@shared/ui/card',
              message: 'Ops DS: usa OpsPanel desde ops/ui (no Card ERP).',
            },
            {
              name: '@shared/ui/badge',
              message: 'Ops DS: usa OpsBadge desde ops/ui (no Badge ERP).',
            },
            {
              name: '@shared/ui/table',
              message: 'Ops DS: usa OpsTable desde ops/ui (no Table ERP).',
            },
            {
              name: '@shared/ui/button',
              message: 'Ops DS: usa OpsButton desde ops/ui (no Button ERP).',
            },
            {
              name: '@shared/ui/sheet',
              message: 'Ops DS: usa OpsSheet desde ops/ui (no Sheet ERP).',
            },
            {
              name: '@shared/ui/dialog',
              message: 'Ops DS: usa OpsDialog desde ops/ui (no Dialog ERP).',
            },
            {
              name: '@shared/ui/tabs',
              message: 'Ops DS: no montar Tabs ERP.',
            },
            {
              name: '@shared/ui/page-shells',
              message: 'Ops DS: no usar page-shells ERP.',
            },
            {
              name: '@shared/ui/theme',
              message:
                'Ops DS: importá contrastCompute/contrastPairs por subpath; no el barrel ThemeCycle.',
            },
          ],
          patterns: [
            {
              group: [
                '@shared/ui/card/*',
                '@shared/ui/badge/*',
                '@shared/ui/table/*',
                '@shared/ui/button/*',
                '@shared/ui/sheet/*',
                '@shared/ui/dialog/*',
                '@shared/ui/tabs/*',
                '@shared/ui/page-shells/*',
                '@shared/ui/theme/ThemeToggle',
                '@shared/ui/theme/ThemeToggle.*',
                '@shared/ui/theme/themeRuntime',
                '@shared/ui/theme/themeRuntime.*',
                '@shared/ui/theme/paletteRuntime',
                '@shared/ui/theme/paletteRuntime.*',
                '@shared/ui/theme/PaletteSwitch',
                '@shared/ui/theme/PaletteSwitch.*',
                '@shared/ui/theme/types',
                '@shared/ui/theme/types.*',
              ],
              message:
                'Ops DS: solo contrast* shared en showcase/tests; no ThemeCycle/runtime ERP.',
            },
            {
              group: [
                '@/pages/design-system',
                '@/pages/design-system/*',
                '**/pages/design-system/**',
              ],
              message:
                'Ops: no importar ERP /design-system (FOUND-D9). Showcase en ops/design-system.',
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
