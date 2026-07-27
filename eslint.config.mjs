import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['node_modules', 'dist', '.vscode', '**/*.js', '**/*.mjs'],
  },
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      'unused-imports': {
        rules: {
          'unused-imports/no-unused-vars': [
            'warn',
            { vars: 'all', varsIgnorePattern: '^_', args: 'all', argsIgnorePattern: '^_' },
          ],
          'unused-imports/no-unused-imports': 'error',
        },
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-extra-semi': 'off',
      // 'no-console': 'warn',
      'max-len': [
        'warn',
        {
          code: 150,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
    },
  },
]
