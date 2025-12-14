// .eslintrc.cjs (flat / CommonJS)
const { defineConfig } = require('eslint/config');

const globals = require('globals');
const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  // top-level settings and ignores
  {
    // ignore generated / output folders so compiled/transpiled files are not linted
    ignorePatterns: ['node_modules/', 'lib/', 'dist/', 'build/', 'coverage/'],

    extends: compat.extends('plugin:prettier/recommended'),

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // TypeScript-specific override (only applies to .ts/.tsx)
  {
    files: ['**/*.ts', '**/*.tsx'],

    extends: compat.extends('plugin:@typescript-eslint/recommended'),

    languageOptions: {
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },

        // enable the project option only if you want type-aware rules (slower)
        // remove or comment out `project` if tsconfig.json isn't present or you don't want type-aware linting.
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },

    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]);
