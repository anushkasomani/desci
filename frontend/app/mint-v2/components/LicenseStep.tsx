'use client'

type Suggested = {
  license_id: string
  license_name: string
  license_type: string
  royalties: { model: string; value: number; payment_interval_days?: number | null; mint_fee: number; notes?: string }
  restrictions: string[]
}

type Props = {
  suggestions: Suggested[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onBack: () => void
  onNext: () => void
  busy?: boolean
  error?: string | null
}

export default function LicenseStep({ suggestions, selectedIds, onToggle, onBack, onNext, busy, error }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">AI-Suggested License Terms</h2>
      <p className="text-sm text-gray-600 mb-4">Select one or more license terms to publish as offers.</p>
      {error && <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map(s => {
          const selected = selectedIds.includes(s.license_id)
          return (
            <button key={s.license_id} onClick={() => onToggle(s.license_id)} className={`text-left p-4 rounded-xl border ${selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
              <div className="font-semibold text-gray-900">{s.license_name}</div>
              <div className="text-xs text-gray-500">{s.license_type}</div>
              <div className="mt-2 text-sm text-gray-700">Royalty Model: {s.royalties.model} ({s.royalties.value})</div>
              <div className="mt-1 text-xs text-gray-600">Mint Fee: {s.royalties.mint_fee} SEI</div>
              {s.royalties.notes && <div className="mt-1 text-xs text-gray-500">{s.royalties.notes}</div>}
              {s.restrictions?.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-gray-600">
                  {s.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-5 py-2 rounded-lg border">Back</button>
        <button disabled={busy || selectedIds.length === 0} onClick={onNext} className={`px-5 py-2 rounded-lg text-white ${(busy || selectedIds.length === 0) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{busy ? 'Generating...' : 'Continue'}</button>
      </div>
    </div>
  )
}


