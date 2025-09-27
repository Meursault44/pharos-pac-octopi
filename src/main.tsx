import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import { App } from './App.tsx';

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <ChakraProvider value={createSystem(defaultConfig)}>
              <App />
            </ChakraProvider>
          </QueryClientProvider>
      </WagmiProvider>
  </StrictMode>,
);
