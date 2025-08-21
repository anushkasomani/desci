'use client'

type Props = {
  note?: string
  primaryFileName?: string
  onBack: () => void
  onNext: () => void
  onUpload: (f: File) => void
  busy?: boolean
  error?: string | null
}

export default function UploadStep({ note, primaryFileName, onBack, onNext, onUpload, busy, error }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload your primary content</h2>
      {note && <p className="text-sm text-gray-600 mb-4">{note}</p>}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input type="file" id="primary" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
        <label htmlFor="primary" className="cursor-pointer">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <p className="mt-2 text-sm text-gray-600"><span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop</p>
          <p className="mt-1 text-xs text-gray-500">Common formats supported</p>
        </label>
      </div>
      {primaryFileName && <p className="mt-2 text-sm text-gray-600">✓ {primaryFileName}</p>}
      {busy && <p className="mt-2 text-blue-600 text-sm">AI processing...</p>}
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-5 py-2 rounded-lg border">Back</button>
        <button disabled={!primaryFileName} onClick={onNext} className={`px-5 py-2 rounded-lg text-white ${primaryFileName ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}>Continue</button>
      </div>
    </div>
  )
}


