'use client'

import { useWallet } from '../hooks/useWallet'
import { motion, AnimatePresence } from 'framer-motion'
import { UsersIcon, XMarkIcon } from '@heroicons/react/24/solid'

type GovernanceModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function GovernanceModal({ isOpen, onClose }: GovernanceModalProps) {
  const { isMinting, handleMintTokens, error } = useWallet()
  
  const onMintClick = async () => {
    const success = await handleMintTokens()
    if (success) {
      onClose() // Close modal on successful mint
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative max-w-lg w-full bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                  <UsersIcon className="w-8 h-8 text-cyan-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">Join the Governance</h2>
              <p className="mt-2 text-gray-400">Mint governance tokens to vote on proposals, participate in dispute resolution, and shape the future of GENOME.</p>
            </div>
            
            <div className="mt-8 space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Mint Price</p>
                    <p className="text-xl font-bold text-white">100 Tokens for 0.1 SEI</p>
                </div>
                <button
                    onClick={onMintClick}
                    disabled={isMinting}
                    className="w-full py-3.5 text-md font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-60"
                >
                    {isMinting ? "Minting..." : "Mint Governance Tokens"}
                </button>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GovernanceModal;