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
          message:
            'Extract this parameter object type to a named type or interface (Clean Code Ch.3 argument objects).',
        },
        {
          selector: ':function > ObjectPattern[typeAnnotation.typeAnnotation.type="TSTypeLiteral"]',
          message:
            'Extract this parameter object type to a named type or interface (Clean Code Ch.3 argument objects).',
        },
      ],
      // Clean Code Ch.4 (PB-93): Comments — allow TODO; ban stale/urgent markers
      'no-warning-comments': ['error', { terms: ['fixme', 'xxx', 'hack'], location: 'start' }],
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
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  eslintConfigPrettier,
]);
