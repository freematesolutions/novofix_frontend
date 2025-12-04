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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Prevent passing empty string to boolean JSX attributes (e.g., inert="")
      // Enforce using real booleans: inert={true|false}, disabled={...}, etc.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXAttribute[value.type='Literal'][value.value=''][name.name=/^(inert|disabled|checked|open|hidden|readOnly|readonly|required|multiple|selected|autoFocus|autofocus|autoPlay|autoplay|controls|loop|muted|playsInline|playsinline)$/]",
          message:
            'Boolean JSX attribute "{{name.name}}" should not be an empty string. Use a boolean, e.g., {{name.name}}={condition}.',
        },
      ],
    },
  },
])
