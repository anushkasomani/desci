// components/gallery/modals/DerivativeModal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IPNFT, DerivativeFormData } from '../../../types/gallery'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useIPGallery } from '@/app/hooks/useIPGallery'

type ModalProps = { isOpen: boolean, onClose: () => void, ip: IPNFT }

export function DerivativeModal({ isOpen, onClose, ip }: ModalProps) {
    const { handleCreateDerivative, isCreatingDerivative } = useIPGallery()
    const [formData, setFormData] = useState<DerivativeFormData>({
        title: `Derivative of: ${ip.metadata?.title || `IP #${ip.tokenId}`}`,
        description: '',
        derivativeType: 'EXTENSION',
        isCommercial: false,
        parentTokenIds: [ip.tokenId],
        licenseTokenIds: []
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const isCheckbox = type === 'checkbox'
        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const success = await handleCreateDerivative(ip, formData)
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
                        className="relative max-w-2xl w-full bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b border-gray-800">
                             <h2 className="text-xl font-bold text-white">Create Derivative IP</h2>
                             <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                    <input name="title" id="title" type="text" value={formData.title} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe your derivative work..."/>
                                </div>
                                 <div>
                                    <label htmlFor="derivativeType" className="block text-sm font-medium text-gray-300 mb-2">Derivative Type</label>
                                    <select name="derivativeType" id="derivativeType" value={formData.derivativeType} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="REMIX">Remix</option>
                                        <option value="EXTENSION">Extension</option>
                                        <option value="COLLABORATION">Collaboration</option>
                                        <option value="VALIDATION">Validation</option>
                                        <option value="CRITIQUE">Critique</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <input id="isCommercial" name="isCommercial" type="checkbox" checked={formData.isCommercial} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-600 rounded bg-gray-800 focus:ring-indigo-500"/>
                                    <label htmlFor="isCommercial" className="ml-3 block text-sm text-gray-300">Allow for commercial use</label>
                                </div>
                                <div className="p-4 bg-gray-800/30 rounded-lg">
                                     <p className="text-sm text-gray-400">Parent IP Asset:</p>
                                     <p className="font-semibold text-white mt-1">#{ip.tokenId}: {ip.metadata?.title}</p>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={isCreatingDerivative} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50">
                                    {isCreatingDerivative ? 'Creating...' : 'Create Derivative'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}