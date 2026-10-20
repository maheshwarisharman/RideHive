import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'web-build/',
      '*.config.js',
      'jest.setup.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
