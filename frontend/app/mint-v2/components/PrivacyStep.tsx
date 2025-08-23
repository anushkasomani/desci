'use client'
import { EyeIcon, LockClosedIcon } from '@heroicons/react/24/solid'
type Props = { onSelect: (choice: 'public' | 'private') => void, onBack: () => void }
export function PrivacyStep({ onSelect, onBack }: Props) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Choose Content Privacy</h2>
            <p className="text-gray-400 mb-8">Decide how the underlying file for your IP asset will be stored.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={() => onSelect('public')} className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-left hover:border-cyan-500 hover:bg-gray-800 transition-all">
                    <EyeIcon className="w-8 h-8 text-cyan-400 mb-3" />
                    <h3 className="text-lg font-bold text-white">Public</h3>
                    <p className="text-sm text-gray-500">The file will be publicly accessible on IPFS for maximum transparency.</p>
                 </button>
                 <button onClick={() => onSelect('private')} className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-left hover:border-purple-500 hover:bg-gray-800 transition-all">
                     <LockClosedIcon className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="text-lg font-bold text-white">Private</h3>
                    <p className="text-sm text-gray-500">The file is client-side encrypted before upload. Only license holders can gain access.</p>
                 </button>
            </div>
             <div className="mt-8 flex justify-between">
                <button type="button" onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Back</button>
            </div>
        </div>
    )
}
export default PrivacyStep