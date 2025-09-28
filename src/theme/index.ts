// src/theme.ts
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    'html, body': {
      fontFamily: "'Open Sans', system-ui, sans-serif",
    },

    html: {
      fontSize: '16px',
    },

    '@media (max-width: 1280px)': {
      html: {
        fontSize: '12px',
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
