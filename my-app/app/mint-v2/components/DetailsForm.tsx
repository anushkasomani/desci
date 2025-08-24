// components/mint/DetailsForm.tsx
'use client'

import { useState } from 'react'
import { FormState, Owner } from "../../types/mint"
import { AuthorsEditor } from './AuthorsEditor'
import { OwnersEditor } from './OwnersEditor'

type Props = {
    initialData: FormState
    onSubmit: (data: FormState) => void
    onBack: () => void
}

export function DetailsForm({ initialData, onSubmit, onBack }: Props) {
    const [form, setForm] = useState<FormState>(initialData)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
            <h2 className="text-2xl font-bold text-white mb-2">Review & Refine Details</h2>
            <p className="text-gray-400 mb-8">Our AI has pre-filled the details below. Please review and make any necessary changes.</p>

            <div className="space-y-6">
                <OwnersEditor owners={form.owners} setOwners={(newOwners: Owner[]) => setForm(prev => ({ ...prev, owners: newOwners }))} />
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input name="title" id="title" type="text" value={form.title} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description / Abstract</label>
                    <textarea name="description" id="description" rows={5} value={form.description} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-300 mb-2">Keywords (comma-separated)</label>
                    <input name="keywords" id="keywords" type="text" value={form.keywords} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <AuthorsEditor authors={form.authors} setAuthors={(newAuthors) => setForm(prev => ({ ...prev, authors: newAuthors }))} />
            </div>

            <div className="mt-8 flex justify-between">
                <button type="button" onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Back</button>
                <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Continue to Licensing</button>
            </div>
        </form>
    )
}