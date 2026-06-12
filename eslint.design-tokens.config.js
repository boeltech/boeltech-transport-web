import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

const RAW_COLOR_MESSAGE =
  'Usa tokens del design system (p. ej. bg-destructive-soft, text-warning) en lugar de colores Tailwind crudos.'

export default defineConfig([
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
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(bg|text|border)-(red|blue|green|yellow|amber|emerald|gray|slate|white)-\\d/]',
          message: RAW_COLOR_MESSAGE,
        },
        {
          selector:
            'TemplateElement[value.raw=/\\b(bg|text|border)-(red|blue|green|yellow|amber|emerald|gray|slate|white)-\\d/]',
          message: RAW_COLOR_MESSAGE,
        },
      ],
    },
  },
])
