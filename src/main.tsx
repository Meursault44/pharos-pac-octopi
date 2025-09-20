import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <ChakraProvider value={createSystem(defaultConfig)}>
          <App />
      </ChakraProvider>
  </StrictMode>,
)
