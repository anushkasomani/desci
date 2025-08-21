'use client'

type Props = {
  summary: { typeLabel: string; privacy: string }
  error?: string | null
  busy?: boolean
  onBack: () => void
  onMint: () => void
}

export default function MintStep({ summary, error, busy, onBack, onMint }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mint</h2>
      <ul className="text-sm text-gray-700 mb-4 list-disc pl-5">
        <li>Type: {summary.typeLabel}</li>
        <li>Privacy: {summary.privacy}</li>
      </ul>
      {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-2 rounded-lg border">Back</button>
        <button disabled={busy} onClick={onMint} className={`px-6 py-3 rounded-lg text-white ${busy ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{busy ? 'Minting...' : 'Mint IP NFT'}</button>
      </div>
      <p className="text-xs text-gray-500 mt-3">For production, integrate access control (e.g., Lit Protocol) to distribute decryption keys to license buyers.</p>
    </div>
  )
}


