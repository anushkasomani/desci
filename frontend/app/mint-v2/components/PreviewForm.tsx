'use client'
import { useState, useEffect } from 'react'
import { Author, FormState } from '../types'

type Props = {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  summaryResponse?: any
  onBack: () => void
  onNext: () => void
  onAddAuthor: () => void
  onRemoveAuthor: (i: number) => void
  onSetAuthor: (i: number, key: keyof Author, value: string) => void
}

type LicenseSuggestion = {
  license_id: string
  license_name: string
  license_type: string
  royalties: {
    model: string
    value: number
    payment_interval_days: number
    mint_fee: number
  }
  restrictions: string[]
}

export default function PreviewForm({ form, setForm, summaryResponse, onBack, onNext, onAddAuthor, onRemoveAuthor, onSetAuthor }: Props) {
  const [licenseSuggestions, setLicenseSuggestions] = useState<LicenseSuggestion[]>([])
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([])
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false)
  const [licenseError, setLicenseError] = useState<string | null>(null)

  // Fetch license suggestions when component mounts
  useEffect(() => {
    const fetchLicenses = async () => {
      if (!form.title && !form.description) return
      
      setIsLoadingLicenses(true)
      setLicenseError(null)
      
             try {
         // Create a JSON file from the summary response
         const jsonBlob = new Blob([JSON.stringify(summaryResponse)], { type: 'application/json' })
         const jsonFile = new File([jsonBlob], 'summary.json', { type: 'application/json' })
         
         const formData = new FormData()
         formData.append('file', jsonFile)
         
         const resp = await fetch('https://sei-licence.onrender.com/generate-licenses/', {
           method: 'POST',
           body: formData
         })
        
        if (!resp.ok) throw new Error(`License API failed: ${resp.status}`)
        const json = await resp.json()
        setLicenseSuggestions(Array.isArray(json) ? json : [])
      } catch (e: any) {
        setLicenseError(e?.message || 'Failed to fetch license suggestions')
      } finally {
        setIsLoadingLicenses(false)
      }
    }

    fetchLicenses()
  }, [form.title, form.description, form.keywords, form.aiSummary, form.authors])

  const handleLicenseToggle = (licenseId: string) => {
    setSelectedLicenses(prev => 
      prev.includes(licenseId) 
        ? prev.filter(id => id !== licenseId)
        : [...prev, licenseId]
    )
  }

  const handleContinue = () => {
    // Store selected licenses in form state for the mint step
    setForm((prev: FormState) => ({
      ...prev,
      selectedLicenses: selectedLicenses,
      licenseSuggestions: licenseSuggestions
    }))
    onNext()
  }
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preview and Edit</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
          <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">AI Summary</label>
          <textarea rows={4} value={form.aiSummary} onChange={(e) => setForm({ ...form, aiSummary: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        </div>
      </div>

      {/* Authors */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Authors</h3>
          <button onClick={onAddAuthor} className="text-blue-600 text-sm">+ Add Author</button>
        </div>
        {form.authors.map((a, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 border rounded-lg">
            <input placeholder="Name" value={a.name} onChange={e => onSetAuthor(i, 'name', e.target.value)} className="px-3 py-2 border rounded" />
            <input placeholder="ORCID" value={a.orcid || ''} onChange={e => onSetAuthor(i, 'orcid', e.target.value)} className="px-3 py-2 border rounded" />
            <input placeholder="Affiliation" value={a.affiliation || ''} onChange={e => onSetAuthor(i, 'affiliation', e.target.value)} className="px-3 py-2 border rounded" />
            <div className="flex items-center gap-2">
              <input placeholder="Wallet 0x..." value={a.wallet || ''} onChange={e => onSetAuthor(i, 'wallet', e.target.value)} className="flex-1 px-3 py-2 border rounded" />
              {form.authors.length > 1 && (
                <button onClick={() => onRemoveAuthor(i)} className="text-red-600 text-sm">Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI License Suggestions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Suggested License Options</h3>
        
        {isLoadingLicenses && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating license suggestions...</p>
          </div>
        )}
        
        {licenseError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{licenseError}</p>
          </div>
        )}
        
        {licenseSuggestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {licenseSuggestions.map((license) => (
              <div 
                key={license.license_id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedLicenses.includes(license.license_id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleLicenseToggle(license.license_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{license.license_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{license.license_type}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Mint Fee:</span> {license.royalties.mint_fee} SEI
                      </p>
                      {license.restrictions.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Restrictions:</p>
                          <ul className="text-xs text-gray-500 ml-2">
                            {license.restrictions.map((restriction, idx) => (
                              <li key={idx}>• {restriction}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedLicenses.includes(license.license_id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedLicenses.includes(license.license_id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedLicenses.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <span className="font-medium">{selectedLicenses.length}</span> license{selectedLicenses.length > 1 ? 's' : ''} selected. 
              Each will be created as a separate license offer during minting.
            </p>
          </div>
        )}
      </div>

      {/* Default License */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default License Type</label>
          <select value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })} className="w-full px-4 py-3 border rounded-lg">
            <option value="CC-BY-4.0">Creative Commons Attribution 4.0 International</option>
            <option value="CC-BY-SA-4.0">CC Attribution-ShareAlike 4.0</option>
            <option value="MIT">MIT</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Default License Terms</label>
          <textarea rows={4} value={form.licenseTerms} onChange={(e) => setForm({ ...form, licenseTerms: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-5 py-2 rounded-lg border">Back</button>
        <button onClick={handleContinue} className="px-5 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700">Continue</button>
      </div>
    </div>
  )
}


