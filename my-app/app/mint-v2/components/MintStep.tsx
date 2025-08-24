'use client'
import { CubeTransparentIcon } from "@heroicons/react/24/solid"
type Props = { onMint: () => void, onBack: () => void, isLoading: boolean, loadingMessage: string, error: string | null }
export function MintStep({ onMint, onBack, isLoading, loadingMessage, error }: Props) {
    return (
        <div className="text-center">
            <CubeTransparentIcon className="w-16 h-16 mx-auto text-indigo-400" />
            <h2 className="text-3xl font-bold text-white mt-4">You're Ready to Mint</h2>
            <p className="text-gray-400 mt-2 mb-8 max-w-md mx-auto">Review your choices on the progress bar above. Once you mint, the IP asset will be permanently recorded on the blockchain.</p>
            {error && <p className="my-4 p-4 bg-red-900/50 text-red-300 border border-red-500/30 rounded-lg">{error}</p>}
            {isLoading ? (
                <div className="p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
                    <p className="mt-4 text-gray-300">{loadingMessage || 'Processing...'}</p>
                </div>
            ) : (
                <div className="flex justify-center gap-4">
                    <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Back</button>
                    <button onClick={onMint} className="px-8 py-3 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors">Mint IP Asset</button>
                </div>
            )}
        </div>
    )
}
export default MintStep;
