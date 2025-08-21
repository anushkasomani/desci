'use client'

type Props = { value: 'public' | 'private'; onChange: (v: 'public' | 'private') => void; onBack: () => void; onNext: () => void }

export default function PrivacyStep({ value, onChange, onBack, onNext }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visibility</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => onChange('public')} className={`p-6 rounded-xl border text-left ${value === 'public' ? 'border-green-600 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-300 hover:shadow-md'}`}>
          <div className="text-lg font-semibold text-gray-800">Public on IPFS</div>
          <p className="text-sm text-gray-600 mt-1">Content stored as-is on IPFS, anyone can access.</p>
        </button>
        <button onClick={() => onChange('private')} className={`p-6 rounded-xl border text-left ${value === 'private' ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300 hover:shadow-md'}`}>
          <div className="text-lg font-semibold text-gray-800">Private (Encrypted)</div>
          <p className="text-sm text-gray-600 mt-1">Content encrypted client-side (AES-GCM) before upload. Keep the key safe.</p>
        </button>
      </div>
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-5 py-2 rounded-lg border">Back</button>
        <button onClick={onNext} className="px-5 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700">Continue</button>
      </div>
    </div>
  )
}


