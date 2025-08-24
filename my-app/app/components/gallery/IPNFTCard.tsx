// components/gallery/IPNFTCard.tsx
'use client'

import { motion } from 'framer-motion'
import { IPNFT } from '../../types/gallery'

type IPNFTCardProps = {
    ip: IPNFT
    onActionClick: (ip: IPNFT, modalType: 'details' | 'derivative' | 'dispute') => void
}

export function IPNFTCard({ ip, onActionClick }: IPNFTCardProps) {
    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }
    
    return (
        <motion.div 
            variants={cardVariants}
            className="group relative flex flex-col bg-gray-900 border border-indigo-500/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors duration-300"
        >
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{ip.metadata?.ip_type || 'IP ASSET'}</span>
                    <span className="text-xs font-mono text-gray-500">#{ip.tokenId}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {ip.metadata?.title || `Untitled IP Asset`}
                </h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-3">
                    {ip.metadata?.description || 'No description available.'}
                </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Actions</p>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onActionClick(ip, 'details')} className="flex-1 text-center px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-indigo-600 hover:text-white transition-colors">Details</button>
                    <button onClick={() => onActionClick(ip, 'derivative')} className="flex-1 text-center px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-indigo-600 hover:text-white transition-colors">Derivative</button>
                    <button onClick={() => onActionClick(ip, 'dispute')} className="flex-1 text-center px-3 py-2 text-sm bg-gray-800 text-red-400 rounded-md hover:bg-red-600 hover:text-white transition-colors">Report</button>
                </div>
            </div>
        </motion.div>
    )
}