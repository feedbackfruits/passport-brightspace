import fbfConfig from '@feedbackfruits/eslint-config';

export default [
  ...fbfConfig,
  {
    rules: {
      'no-shadow': 0,
      'import/named': 0,
      'import/no-named-as-default': 0,
      'import/no-named-as-default-member': 0,
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/no-require-imports': 0
    }
  }
];
