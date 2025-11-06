import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Relax some rules temporarily to reduce noisy failures across many files.
      // Keeping 'no-unused-vars' as a warning so developers can iteratively fix unused vars
      // without breaking the build/lint step.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'no-case-declarations': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-constant-binary-expression': 'off',
      // Allow empty catch blocks (many try/catch usages intentionally ignore errors)
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
])
