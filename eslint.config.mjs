import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['node_modules', 'dist', '.vscode', '**/*.js'],
  },
  eslintPluginPrettierRecommended,
  { files: ['**/*.ts'] },
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
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      'no-unused-vars': 'off',
    },
  },
]
