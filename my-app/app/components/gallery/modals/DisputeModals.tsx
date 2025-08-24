// components/gallery/modals/DisputeModal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IPNFT } from '@/app/types/gallery'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { useIPGallery } from '@/app/hooks/useIPGallery'

type ModalProps = { isOpen: boolean, onClose: () => void, ip: IPNFT }

export function DisputeModal({ isOpen, onClose, ip }: ModalProps) {
    const { handleCreateDispute, isCreatingDispute } = useIPGallery()
    const [reason, setReason] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const success = await handleCreateDispute(ip.tokenId, reason)
        if (success) {
            onClose()
        }
    }
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative max-w-lg w-full bg-gray-900 rounded-2xl border border-red-500/20 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b border-gray-800">
                             <div className="flex items-center gap-3">
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-400"/>
                                <h2 className="text-xl font-bold text-white">Report an Issue</h2>
                             </div>
                             <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-800/30 rounded-lg">
                                     <p className="text-sm text-gray-400">You are reporting an issue for the IP Asset:</p>
                                     <p className="font-semibold text-white mt-1">#{ip.tokenId}: {ip.metadata?.title}</p>
                                </div>
                                <div>
                                    <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">Reason for Report</label>
                                    <textarea
                                        id="reason"
                                        rows={5}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Please describe the issue in detail (e.g., plagiarism, incorrect data, ownership dispute)..."
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={isCreatingDispute || !reason.trim()} className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50">
                                    {isCreatingDispute ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default DisputeModal