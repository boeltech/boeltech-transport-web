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
])
