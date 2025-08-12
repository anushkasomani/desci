'use client';
 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { sei, seiTestnet } from 'viem/chains';
 
// Dynamic imports
import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
 
// Import Sei Global Wallet for EIP-6963 discovery
import '@sei-js/sei-global-wallet/eip6963';
 
const queryClient = new QueryClient();
 
const wagmiConfig = createConfig({
  chains: [sei, seiTestnet],
  transports: {
    [sei.id]: http('https://evm-rpc.sei-apis.com'),
    [seiTestnet.id]: http('https://evm-rpc-testnet.sei-apis.com')
  }
});
 
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: '955ca8f3-f739-4091-8139-17a5491136e5', 
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: (networks) => [
            ...networks,
            {
              blockExplorerUrls: ['https://seitrace.com'],
              chainId: 1329,
              chainName: 'Sei Network',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/sei.svg'],
              name: 'Sei',
              nativeCurrency: {
                decimals: 18,
                name: 'Sei',
                symbol: 'SEI'
              },
              networkId: 1329,
              rpcUrls: ['https://evm-rpc.sei-apis.com'],
              vanityName: 'Sei Mainnet'
            },
            {
              blockExplorerUrls: ['https://seitrace.com/?chain=testnet'],
              chainId: 1328,
              chainName: 'Sei Testnet',
              iconUrls: ['https://app.dynamic.xyz/assets/networks/sei.svg'],
              name: 'Sei Testnet',
              nativeCurrency: {
                decimals: 18,
                name: 'Sei',
                symbol: 'SEI'
              },
              networkId: 1328,
              rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
              vanityName: 'Sei Testnet'
            }
          ]
        }
      }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}