'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'

export function WalletConnect() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading'
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated')

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="group relative px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors"
                    >
                      <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600 opacity-0 group-hover:opacity-75 transition-opacity blur"></span>
                      <span className="relative">Connect Wallet</span>
                    </button>
                  )
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-500 transition-colors"
                    >
                      Wrong network
                    </button>
                  )
                }

                return (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: chain.iconBackground }}
                      />
                      <span className="text-sm text-gray-300">{chain.name}</span>
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center space-x-3 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span className="text-sm font-mono text-white">
                        {account.displayName}
                      </span>
                    </button>
                  </div>
                )
              })()}
            </div>
          )
        }}
      </ConnectButton.Custom>
    </motion.div>
  )
}
