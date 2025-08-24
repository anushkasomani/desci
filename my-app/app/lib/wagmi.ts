import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sei, seiTestnet } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'GENOME',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', 
  chains: [
   seiTestnet, sei
  ],
  ssr: true,
})
