'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWallet } from '../hooks/useWallet'
import { motion } from 'framer-motion'
import { CubeTransparentIcon } from '@heroicons/react/24/outline'
import { ProfileDropdown } from './ProfileDropdown'
import { GovernanceModal } from './GovernanceModal'

export function Navigation() {
  // REMOVED: All scroll-related state and effects are now gone.
  const { userAddress, tokenBalance, isConnecting, connectWallet } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        // FIXED: The classes are now static, providing a consistent look without changing on scroll.
        className="fixed top-0 left-0 right-0 z-50 bg-gray-950/70 backdrop-blur-xl border-b border-indigo-500/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <CubeTransparentIcon className="w-8 h-8 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-2xl font-bold text-white">GENOME</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-400">
              <Link href="/ip-gallery" className="hover:text-white transition-colors">IP Gallery</Link>
              <Link href="/mint-v2" className="hover:text-white transition-colors">Mint</Link>
              <Link href="/validators" className="hover:text-white transition-colors">Governance</Link>
            </div>

            <div>
              {userAddress ? (
                <ProfileDropdown 
                  userAddress={userAddress} 
                  tokenBalance={tokenBalance}
                  onGovernanceClick={() => setIsModalOpen(true)}
                />
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="group relative px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors disabled:opacity-60"
                >
                  <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600 opacity-0 group-hover:opacity-75 transition-opacity blur"></span>
                  <span className="relative">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
      
      <GovernanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export default Navigation;