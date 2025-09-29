// src/theme.ts
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    'html, body': {
      fontFamily: "'Open Sans', system-ui, sans-serif",
      height: '100%',
      margin: 0,
      padding: 0,
      // ниже 1280px — один размер, от 1280px и выше — другой
      fontSize: { base: '10px', xl: '16px' },
    },
  },
});

export const system = createSystem(defaultConfig, config);
