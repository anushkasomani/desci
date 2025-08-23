// app/ip-gallery/page.tsx
'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { GalleryGrid } from '../components/gallery/GalleryGrid'
import { useIPGallery } from '../hooks/useIPGallery'
import { IPNFT } from '../types/gallery'
import { IPDetailsModal } from '../components/gallery/modals/IPDetailsModal'
import { DerivativeModal } from '../components/gallery/modals/DerivativeModal'
import DisputeModal from '../components/gallery/modals/DisputeModals'

export default function IPGalleryPage() {
    const { ipnfts, loading, error, fetchIPNFTs } = useIPGallery()
    const [selectedIP, setSelectedIP] = useState<IPNFT | null>(null)
    
    const [modal, setModal] = useState<'details' | 'derivative' | 'dispute' | null>(null)

    const handleOpenModal = (ip: IPNFT, modalType: 'details' | 'derivative' | 'dispute') => {
        setSelectedIP(ip)
        setModal(modalType)
    }

    const handleCloseModal = () => {
        setModal(null)
        setSelectedIP(null)
    }

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />
            <main className="pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white">IP Asset Gallery</h1>
                            <p className="mt-2 text-lg text-gray-400">Discover, license, and build upon tokenized intellectual property.</p>
                        </div>
                        <button onClick={() => fetchIPNFTs()} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    <GalleryGrid
                        ipnfts={ipnfts}
                        loading={loading}
                        error={error}
                        onCardClick={handleOpenModal}
                    />
                </div>
            </main>
            <Footer />

            {selectedIP && (
                <>
                    <IPDetailsModal isOpen={modal === 'details'} onClose={handleCloseModal} ip={selectedIP} />
                    <DerivativeModal isOpen={modal === 'derivative'} onClose={handleCloseModal} ip={selectedIP} />
                    <DisputeModal isOpen={modal === 'dispute'} onClose={handleCloseModal} ip={selectedIP} />
                </>
            )}
        </div>
    )
}