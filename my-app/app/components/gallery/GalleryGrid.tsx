// components/gallery/GalleryGrid.tsx
'use client'

import { motion } from 'framer-motion'
import { IPNFT } from '../../types/gallery'
import { IPNFTCard } from './IPNFTCard'

const SkeletonCard = () => (
    <div className="bg-gray-900 border border-indigo-500/10 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded-md w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-800 rounded-md w-full mb-2"></div>
        <div className="h-4 bg-gray-800 rounded-md w-5/6"></div>
        <div className="h-10 bg-gray-800 rounded-lg w-full mt-6"></div>
    </div>
)

type GalleryGridProps = {
    ipnfts: IPNFT[]
    loading: boolean
    error: string | null
    onCardClick: (ip: IPNFT, modalType: 'details' | 'derivative' | 'dispute') => void
}

export function GalleryGrid({ ipnfts, loading, error, onCardClick }: GalleryGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        )
    }

    if (error) {
        return <div className="text-center py-16 text-red-400">{error}</div>
    }

    if (ipnfts.length === 0) {
        return <div className="text-center py-16 text-gray-500">No IP Assets found.</div>
    }

    return (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.05 } }
            }}
        >
            {ipnfts.map(ip => (
                <IPNFTCard key={ip.tokenId} ip={ip} onActionClick={onCardClick} />
            ))}
        </motion.div>
    )
}