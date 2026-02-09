const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['dist/', 'node_modules/', '.eslintrc.js'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
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
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/__tests__/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
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
  },
];
