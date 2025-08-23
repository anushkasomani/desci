'use client'
import { LicenseSuggestion } from "../../types/mint"
import { CheckCircleIcon } from '@heroicons/react/24/solid'
type Props = { suggestions: LicenseSuggestion[]; selectedIds: string[]; onToggle: (id: string) => void; onSubmit: () => void; onBack: () => void; isLoading: boolean; loadingMessage: string; }
export function LicenseStep({ suggestions, selectedIds, onToggle, onSubmit, onBack, isLoading, loadingMessage }: Props) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">AI-Suggested License Terms</h2>
            <p className="text-gray-400 mb-8">Select one or more license terms to publish as on-chain offers for your IP Asset.</p>
            {isLoading ? (
                 <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
                    <p className="mt-4 text-gray-300">{loadingMessage}</p>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="p-6 bg-gray-800/50 rounded-lg text-center text-gray-400">
                    <p>No AI suggestions available. A default, non-commercial license will be applied.</p>
                    <p className="text-xs mt-1">You can create custom offers from your dashboard after minting.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map(s => {
                        const isSelected = selectedIds.includes(s.license_id);
                        return (
                            <button key={s.license_id} onClick={() => onToggle(s.license_id)} className={`relative text-left p-4 bg-gray-800/50 border rounded-lg transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-gray-700 hover:border-indigo-600'}`}>
                                {isSelected && <CheckCircleIcon className="absolute top-4 right-4 w-6 h-6 text-indigo-400" />}
                                <h3 className="font-bold text-white pr-8">{s.license_name}</h3>
                                <p className="text-xs text-cyan-400 uppercase mt-1">{s.license_type}</p>
                                <p className="text-sm text-gray-300 mt-3">Mint Fee: <span className="font-semibold">{s.royalties.mint_fee} ETH</span></p>
                                <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-gray-400">
                                    {s.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </button>
                        )
                    })}
                </div>
            )}
            <div className="mt-8 flex justify-between">
                <button type="button" onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Back</button>
                <button type="button" onClick={onSubmit} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Continue to Privacy</button>
            </div>
        </div>
    )
}
export default LicenseStep;