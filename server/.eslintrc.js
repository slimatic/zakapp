module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-const': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    // Security: Ban unsafe Prisma raw query methods to prevent SQL injection
    'no-restricted-syntax': [
      'error',
      {
        selector: 'MemberExpression[property.name="$executeRawUnsafe"]',
        message: 'Using $executeRawUnsafe creates SQL injection risk. Use $executeRaw with template literals instead.',
      },
      {
        selector: 'MemberExpression[property.name="$queryRawUnsafe"]',
        message: 'Using $queryRawUnsafe creates SQL injection risk. Use $queryRaw with template literals instead.',
      },
    ],
  },
};