// components/gallery/modals/IPDetailsModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { IPNFT } from '@/app/types/gallery'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { ethers } from 'ethers'
import { useIPGallery } from '@/app/hooks/useIPGallery'

type ModalProps = { isOpen: boolean, onClose: () => void, ip: IPNFT }

export function IPDetailsModal({ isOpen, onClose, ip }: ModalProps) {
    const { handleBuyLicense, isBuyingLicense } = useIPGallery()

    const formatWei = (wei: string) => ethers.formatEther(wei)

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative max-w-3xl w-full bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-2xl max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <div className="flex justify-between items-center p-6 border-b border-gray-800">
                            <h2 className="text-2xl font-bold text-white">{ip.metadata?.title}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                         </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <p className="text-gray-400">{ip.metadata?.description}</p>
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Available Licenses</h3>
                                {ip.offers && ip.offers.length > 0 ? (
                                    <div className="space-y-3">
                                        {ip.offers.map(offer => (
                                            <div key={offer.offerIndex} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-cyan-400">{offer.licenseMetadata?.name || 'Standard License'}</p>
                                                    <p className="text-sm text-gray-400 line-clamp-2">{offer.licenseMetadata?.description}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleBuyLicense(ip.tokenId, offer.offerIndex, offer.priceWei)}
                                                    disabled={isBuyingLicense}
                                                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {isBuyingLicense ? "Buying..." : `Buy for ${formatWei(offer.priceWei)} ETH`}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No license offers available for this asset.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}