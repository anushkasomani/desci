import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'GENOME',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // You can get this from https://cloud.walletconnect.com
  chains: [
    mainnet,
    sepolia,
    polygon,
    optimism,
    arbitrum,
    base,
    zora,
  ],
  ssr: true,
})
