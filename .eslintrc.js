module.exports = {
  'root': true,
  'env': {
    'node': true,
    'commonjs': true,
    'es6': true,
    'jquery': false,
    'jest': true,
    'jasmine': true
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'sourceType': 'module',
    'ecmaVersion': '2018'
  },
  'rules': {
    'indent': [
      'error',
      2,
      { 'SwitchCase': 2 }
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-var': [
      'error'
    ],
    'no-console': [
      'off'
    ],
    'no-unused-vars': [
      'error'
    ],
    'no-mixed-spaces-and-tabs': [
      'error'
    ]
  }
};
