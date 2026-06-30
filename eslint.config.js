import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
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
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'padding-line-between-statements': [
        'error',
        // blank line before return
        { blankLine: 'always', prev: '*', next: 'return' },
        // blank line after variable declarations
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        // blank line after if/for/while/try blocks
        { blankLine: 'always', prev: ['if', 'for', 'while', 'try', 'switch'], next: '*' },
        // blank line before if/for/while/try blocks
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'try', 'switch'] },
      ],
    },
  },
])
