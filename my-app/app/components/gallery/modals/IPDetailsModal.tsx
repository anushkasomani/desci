// components/gallery/modals/IPDetailsModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { IPNFT, LicenseOffer } from '../../../types/gallery'
import { XMarkIcon } from '@heroicons/react/24/solid'
import {
    DocumentTextIcon, UserCircleIcon, CalendarDaysIcon, HashtagIcon,
    CpuChipIcon, GlobeAltIcon, LockClosedIcon, ScaleIcon, TagIcon
} from '@heroicons/react/24/outline'
import { ethers } from 'ethers'
import { useIPGallery } from '../../../hooks/useIPGallery'

type ModalProps = { isOpen: boolean, onClose: () => void, ip: IPNFT }

// A small, reusable component for displaying metadata fields
const DetailField = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-base text-white font-medium break-words">{value}</p>
            </div>
        </div>
    );
};

// A styled card for license offers
const LicenseOfferCard = ({ offer, onBuy, isBuying }: { offer: LicenseOffer, onBuy: () => void, isBuying: boolean }) => {
    const formatWei = (wei: string) => ethers.formatEther(wei);
    return (
        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <p className="font-semibold text-cyan-400">{offer.licenseMetadata?.name || 'Standard License'}</p>
                <p className="text-sm text-gray-400 mt-1">{offer.licenseMetadata?.description}</p>
            </div>
            <button
                onClick={onBuy}
                disabled={isBuying}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 whitespace-nowrap w-full sm:w-auto"
            >
                {isBuying ? "Processing..." : `Buy for ${formatWei(offer.priceWei)} ETH`}
            </button>
        </div>
    );
};

 function IPDetailsModal({ isOpen, onClose, ip }: ModalProps) {
    const { handleBuyLicense, isBuyingLicense } = useIPGallery()
    const ipExplorerUrl = `https://testnet.seistream.app/tokens/0x293B992a65c9C6639271aE6452453D0DbE5e4C94/${ip.tokenId}?standart=erc721`

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
                        className="relative max-w-4xl w-full bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-2xl max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-800 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-white truncate pr-4">{ip.metadata?.title}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Key Details */}
                                <div className="lg:col-span-1 space-y-6">
                                    <DetailField icon={DocumentTextIcon} label="Description" value={ip.metadata?.description} />
                                    <DetailField icon={UserCircleIcon} label="Primary Author" value={ip.metadata?.authors?.[0]?.name} />
                                    <DetailField icon={CalendarDaysIcon} label="Creation Date" value={ip.metadata?.date_of_creation ? new Date(ip.metadata.date_of_creation).toLocaleDateString() : '-'} />
                                    <DetailField icon={HashtagIcon} label="Token ID" value={`#${ip.tokenId}`} />
                                    <DetailField icon={LockClosedIcon} label="Encrypted" value={ip.metadata?.encryption?.encrypted ? 'Yes' : 'No'} />
                                    <DetailField icon={GlobeAltIcon} label="Explorer" value={<a href={ipExplorerUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline break-all">View on Seistream</a>} />
                                    {/* Dataset-specific fields */}
                                    {ip.metadata?.ip_type === 'dataset' && (
                                        <>
                                            <DetailField icon={GlobeAltIcon} label="Source" value={ip.metadata?.optional?.source} />
                                            <DetailField icon={CalendarDaysIcon} label="Update Frequency" value={ip.metadata?.optional?.update_frequency} />
                                            <DetailField icon={LockClosedIcon} label="Limitations" value={ip.metadata?.optional?.limitations} />
                                        </>
                                    )}
                                    {/* Formula-specific fields */}
                                    {ip.metadata?.ip_type === 'formula_method' && (
                                        <>
                                            <DetailField icon={TagIcon} label="Applications" value={Array.isArray(ip.metadata?.optional?.application) ? ip.metadata.optional.application.join(', ') : ip.metadata?.optional?.application} />
                                        </>
                                    )}
                                </div>

                                {/* Right Column: Licenses and AI Summary */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <ScaleIcon className="w-5 h-5 text-cyan-400" />
                                            Available Licenses
                                        </h3>
                                        {ip.offers && ip.offers.length > 0 ? (
                                            <div className="space-y-3">
                                                {ip.offers.map(offer => (
                                                    <LicenseOfferCard
                                                        key={offer.offerIndex}
                                                        offer={offer}
                                                        onBuy={() => handleBuyLicense(ip.tokenId, offer.offerIndex, offer.priceWei)}
                                                        isBuying={isBuyingLicense}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-800/50 rounded-lg text-center text-gray-500">
                                                No license offers available for this asset.
                                            </div>
                                        )}
                                    </div>

                                    {/* Keywords for all types */}
                                    {ip.metadata?.keywords && ip.metadata.keywords.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <TagIcon className="w-5 h-5 text-cyan-400" />
                                                Keywords
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {ip.metadata.keywords.map(keyword => (
                                                    <span key={keyword} className="px-3 py-1 bg-gray-800 text-cyan-300 text-xs font-medium rounded-full">{keyword}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Dataset schema for datasets */}
                                    {ip.metadata?.ip_type === 'dataset' && ip.metadata?.optional?.dataset_schema?.columns && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <CpuChipIcon className="w-5 h-5 text-cyan-400" />
                                                Dataset Schema
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-gray-800 rounded-lg">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs text-gray-400">Column Name</th>
                                                            <th className="px-4 py-2 text-left text-xs text-gray-400">Type</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ip.metadata.optional.dataset_schema.columns.map((col: any) => (
                                                            <tr key={col.name}>
                                                                <td className="px-4 py-2 text-sm text-white">{col.name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-300">{col.type}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Summary for all types: show only problem_statement, methodology_summary, results_summary, conclusion_summary */}
                                    {(ip.metadata?.optional?.ai_summary || ip.metadata?.ai_summary) && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                <CpuChipIcon className="w-5 h-5 text-cyan-400" />
                                                AI Summary
                                            </h3>
                                            {(() => {
                                                const aiSummary = ip.metadata?.optional?.ai_summary || ip.metadata?.ai_summary;
                                                if (typeof aiSummary === 'object' && aiSummary !== null) {
                                                    return (
                                                        <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
                                                            {aiSummary.problem_statement && (
                                                                <div>
                                                                    <span className="font-semibold text-cyan-300">Problem Statement:</span>
                                                                    <p className="text-gray-300 mt-1">{aiSummary.problem_statement}</p>
                                                                </div>
                                                            )}
                                                            {aiSummary.methodology_summary && (
                                                                <div>
                                                                    <span className="font-semibold text-cyan-300">Methodology:</span>
                                                                    <p className="text-gray-300 mt-1">{aiSummary.methodology_summary}</p>
                                                                </div>
                                                            )}
                                                            {aiSummary.results_summary && (
                                                                <div>
                                                                    <span className="font-semibold text-cyan-300">Results:</span>
                                                                    <p className="text-gray-300 mt-1">{aiSummary.results_summary}</p>
                                                                </div>
                                                            )}
                                                            {aiSummary.conclusion_summary && (
                                                                <div>
                                                                    <span className="font-semibold text-cyan-300">Conclusion:</span>
                                                                    <p className="text-gray-300 mt-1">{aiSummary.conclusion_summary}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <p className="text-sm text-gray-400 whitespace-pre-wrap bg-gray-800/50 p-4 rounded-lg">
                                                            {aiSummary}
                                                        </p>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
export default IPDetailsModal