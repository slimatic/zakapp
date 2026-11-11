// ESLint 10 removed eslintrc support; this maps the existing rule set (kept in
// eslint.rules.cjs so the rules stay in one place) onto flat config.
const js = require('@eslint/js');
const legacy = require('./eslint.rules.cjs');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['src/**/*.ts'],
    ignores: legacy.ignorePatterns,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: legacy.parserOptions.ecmaVersion,
      sourceType: legacy.parserOptions.sourceType,
      globals: { console: 'readonly', process: 'readonly' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { ...js.configs.recommended.rules, ...legacy.rules },
  },
];
