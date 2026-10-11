// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
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
      // Clean Code Ch.7 (PB-96): Error Handling — only-throw-error needs type-aware lint (PB-76)
      'no-empty': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
    },
  },
  {
    files: ['**/*.{spec,testing}.ts'],
    rules: {
      complexity: 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'max-lines-per-function': 'off',
    },
  },
  // Clean Code Ch.8 (PB-97): Boundaries — Dexie / BudgetDatabase only inside store
  {
    files: ['src/data/domains/**/*.ts', 'src/data/lib/**/*.ts'],
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
          ],
        },
      ],
    },
  },
  // Clean Code Ch.8 (PB-97): Features must not reach Dexie or store internals
  {
    files: ['src/app/**/*.ts'],
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
              group: ['**/document-store/document-store', '**/document-store/document-store.ts'],
              message:
                'Do not import DocumentStore or createDocumentStore from features. Inject domain services; specs use provideTestDocumentStore.',
            },
            {
              group: [
                '**/document-store/document-store.token',
                '**/document-store/document-store.token.ts',
              ],
              message:
                'Do not inject DOCUMENT_STORE from features. Inject domain services; specs use provideTestDocumentStore.',
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
