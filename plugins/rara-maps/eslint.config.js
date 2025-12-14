const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        maplibregl: 'readonly',
        turf: 'readonly',
      },
    },
  },
]);
