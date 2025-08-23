// components/mint/OwnersEditor.tsx
'use client'

import { Owner } from "../../types/mint"

type OwnersEditorProps = {
    owners: Owner[];
    setOwners: (owners: Owner[]) => void;
}

export function OwnersEditor({ owners, setOwners }: OwnersEditorProps) {
    const safeOwners = Array.isArray(owners) ? owners : [];
    const handleOwnerChange = (idx: number, field: keyof Owner, value: string) => {
        const updated = safeOwners.map((o, i) => i === idx ? { ...o, [field]: value } : o)
        setOwners(updated)
    }
    const handleAddOwner = () => {
        setOwners([...safeOwners, { name: '', wallet: '' }])
    }
    const handleRemoveOwner = (idx: number) => {
        setOwners(safeOwners.filter((_, i) => i !== idx))
    }
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Owners (Wallet Addresses)</label>
            <div className="space-y-3">
                {safeOwners.map((owner, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Owner Name (optional)"
                            value={owner.name || ''}
                            onChange={e => handleOwnerChange(idx, 'name', e.target.value)}
                            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-1/3"
                        />
                        <input
                            type="text"
                            placeholder="Wallet Address (0x...)"
                            value={owner.wallet}
                            onChange={e => handleOwnerChange(idx, 'wallet', e.target.value)}
                            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm w-2/3"
                        />
                        <button type="button" onClick={() => handleRemoveOwner(idx)} className="text-red-400 hover:text-red-600 px-2 py-1">Remove</button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={handleAddOwner} className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Add Owner</button>
            <p className="text-xs text-gray-500 mt-1">All listed owners will have ownership rights and receive royalties.</p>
        </div>
    )
}