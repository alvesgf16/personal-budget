// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const vitest = require('@vitest/eslint-plugin');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // Clean Code Ch.2 (PB-91): Meaningful Names
      'id-length': [
        'error',
        {
          min: 2,
          exceptions: ['_', 'i', 'j', 'k'],
        },
      ],
      'id-denylist': ['error', 'temp', 'tmp', 'foo', 'bar', 'baz', 'obj', 'arr'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          // Cell keys and other quoted map keys (e.g. `categoryId:month`)
          selector: 'objectLiteralProperty',
          modifiers: ['requiresQuotes'],
          format: null,
        },
        {
          selector: 'method',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
      ],
      // Clean Code Ch.3 (PB-92): Functions — book metrics
      complexity: ['error', 5],
      'max-depth': ['error', 2],
      'max-params': ['error', 3],
      'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: ':function > Identifier[typeAnnotation.typeAnnotation.type="TSTypeLiteral"]',
          message: 'Extract this parameter object type to a named type or interface.',
        },
        {
          selector: ':function > ObjectPattern[typeAnnotation.typeAnnotation.type="TSTypeLiteral"]',
          message: 'Extract this parameter object type to a named type or interface.',
        },
      ],
      // Clean Code Ch.4 (PB-93): Comments — allow TODO; ban stale/urgent markers
      'no-warning-comments': ['error', { terms: ['fixme', 'xxx', 'hack'], location: 'start' }],
      // Clean Code Ch.7 (PB-96) + Ch.13 (PB-102): Error Handling / async type-aware rules
      'no-empty': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      // Clean Code Ch.10 (PB-99): Classes — size / DI cohesion (Angular-friendly)
      'max-classes-per-file': ['error', 1],
      'max-lines': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      '@angular-eslint/sort-lifecycle-methods': 'error',
      '@angular-eslint/component-max-inline-declarations': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error',
    },
  },
  // Clean Code Ch.9 (PB-98): Unit Tests — Vitest gates + dual-standard Ch.3/Ch.10 size offs
  {
    files: ['**/*.{spec,harness}.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/max-expects': ['error', { max: 4 }],
      complexity: 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-classes-per-file': 'off',
    },
  },
  // Clean Code Ch.8 (PB-97) + Ch.11 (PB-100): Domains — no Dexie/store impl; no upward app imports
  {
    files: ['src/data/domains/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dexie',
              message:
                'Dexie stays inside the document store. Inject DOCUMENT_STORE from domain services.',
            },
          ],
          patterns: [
            {
              group: ['**/store/database', '**/store/database.*'],
              message: 'BudgetDatabase stays inside the document store. Inject DOCUMENT_STORE.',
            },
            {
              group: [
                '**/document-store/document-store',
                '**/document-store/document-store.ts',
                '**/document-store/document-store.js',
              ],
              message:
                'Do not import DocumentStore or createDocumentStore from domains. Inject DOCUMENT_STORE.',
            },
            {
              group: ['**/app/**'],
              message:
                'Domains must not import from src/app. Dependency direction is features → domains → store.',
            },
          ],
        },
      ],
    },
  },
  // Clean Code Ch.8 (PB-97) + Ch.11 (PB-100): Lib — leaf helpers; no Dexie/store impl, app, or domains
  {
    files: ['src/data/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dexie',
              message:
                'Dexie stays inside the document store. Keep lib free of persistence imports.',
            },
          ],
          patterns: [
            {
              group: ['**/store/database', '**/store/database.*'],
              message:
                'BudgetDatabase stays inside the document store. Keep lib free of persistence.',
            },
            {
              group: [
                '**/document-store/document-store',
                '**/document-store/document-store.ts',
                '**/document-store/document-store.js',
              ],
              message:
                'Do not import DocumentStore or createDocumentStore from lib. Keep lib a pure leaf.',
            },
            {
              group: [
                '**/document-store/document-store.token',
                '**/document-store/document-store.token.ts',
                '**/document-store/document-store.token.js',
              ],
              message:
                'Do not inject DOCUMENT_STORE from lib. Keep lib a pure leaf free of persistence.',
            },
            {
              group: ['**/app/**'],
              message:
                'Lib must not import from src/app. Dependency direction is features → domains → store.',
            },
            {
              group: ['**/domains/**'],
              message:
                'Lib must not import from domains. Keep lib a pure leaf below domains and features.',
            },
          ],
        },
      ],
    },
  },
  // Clean Code Ch.11 (PB-100): Systems — store must not depend upward on app or domains
  {
    files: ['src/data/store/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/app/**'],
              message:
                'Store must not import from src/app. Dependency direction is features → domains → store.',
            },
            {
              group: ['**/domains/**'],
              message:
                'Store must not import from domains. Dependency direction is features → domains → store.',
            },
          ],
        },
      ],
    },
  },
  // Clean Code Ch.8 (PB-97): Feature specs may use the harness seam; not the store impl/token
  // Ch.11 (PB-100): store/types and data/lib remain allowed downward seams
  {
    files: ['src/app/**/*.{spec,harness}.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dexie',
              message: 'Dexie stays inside the document store. Use domain services from features.',
            },
          ],
          patterns: [
            {
              group: ['**/store/database', '**/store/database.*'],
              message: 'BudgetDatabase stays inside the document store. Use domain services.',
            },
            {
              group: [
                '**/document-store/document-store',
                '**/document-store/document-store.ts',
                '**/document-store/document-store.js',
              ],
              message:
                'Do not import DocumentStore or createDocumentStore from features. Specs use provideDocumentStoreHarness.',
            },
            {
              group: [
                '**/document-store/document-store.token',
                '**/document-store/document-store.token.ts',
                '**/document-store/document-store.token.js',
              ],
              message:
                'Do not inject DOCUMENT_STORE from features. Specs use provideDocumentStoreHarness.',
            },
          ],
        },
      ],
    },
  },
  // Clean Code Ch.8 (PB-97): Production features must not reach store or harness seam
  // Ch.11 (PB-100): store/types and data/lib remain allowed downward seams
  {
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/**/*.{spec,harness}.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dexie',
              message: 'Dexie stays inside the document store. Use domain services from features.',
            },
          ],
          patterns: [
            {
              group: ['**/store/database', '**/store/database.*'],
              message: 'BudgetDatabase stays inside the document store. Use domain services.',
            },
            {
              group: [
                '**/document-store/document-store',
                '**/document-store/document-store.ts',
                '**/document-store/document-store.js',
              ],
              message:
                'Do not import DocumentStore or createDocumentStore from features. Inject domain services.',
            },
            {
              group: [
                '**/document-store/document-store.token',
                '**/document-store/document-store.token.ts',
                '**/document-store/document-store.token.js',
              ],
              message: 'Do not inject DOCUMENT_STORE from features. Inject domain services.',
            },
            {
              group: [
                '**/document-store/document-store.harness',
                '**/document-store/document-store.harness.ts',
                '**/document-store/document-store.harness.js',
                '**/document-store/document-store.harness-types',
                '**/document-store/document-store.harness-types.ts',
                '**/document-store/document-store.harness-types.js',
              ],
              message:
                'Do not import the document-store harness seam from production features. Specs use provideDocumentStoreHarness.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  eslintConfigPrettier,
]);
