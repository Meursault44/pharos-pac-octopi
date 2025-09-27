// wagmi.ts
import { createConfig } from 'wagmi'
import { defineChain, webSocket } from 'viem'
import { injected } from 'wagmi/connectors' // ✅

export const pharosTestnet = defineChain({
  id: 688_688,
  name: 'Pharos Testnet',
  network: 'pharos-testnet',
  nativeCurrency: { name: 'Pharos', symbol: 'PHRS', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://api.zan.top/node/v1/pharos/testnet/ffdeb72fa31a48b281ed513728fb4ce8'],
      webSocket: ['wss://api.zan.top/node/ws/v1/pharos/testnet/ffdeb72fa31a48b281ed513728fb4ce8'],
    },
  },
  blockExplorers: {
    default: { name: 'PharosScan', url: 'https://pharos-testnet.socialscan.io' },
  },
  testnet: true,
})

export const PHAROS_FAUCET_ADDRESS = '0x157288511Cee7788e8887C906d3ADB8c27088B5f' as const

export const config = createConfig({
  chains: [pharosTestnet],
  connectors: [
    injected({ target: 'metaMask' }),
  ],
  transports: {
    [pharosTestnet.id]: webSocket(pharosTestnet.rpcUrls.default.webSocket![0]),
    // опционально fallback:
    // [pharosTestnet.id]: fallback([
    //   webSocket(pharosTestnet.rpcUrls.default.webSocket![0]),
    //   http(pharosTestnet.rpcUrls.default.http[0]),
    // ]),
  },
})
