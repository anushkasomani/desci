// components/mint/AuthorsEditor.tsx
'use client'
import { Author } from "../../types/mint"
import { TrashIcon, PlusIcon } from '@heroicons/react/24/solid'
type Props = { authors: Author[]; setAuthors: (authors: Author[]) => void }
export function AuthorsEditor({ authors, setAuthors }: Props) {
    const handleAuthorChange = (index: number, field: keyof Author, value: string) => {
        const newAuthors = [...authors];
        newAuthors[index] = { ...newAuthors[index], [field]: value };
        setAuthors(newAuthors);
    }
    const addAuthor = () => setAuthors([...authors, { name: '' }])
    const removeAuthor = (index: number) => setAuthors(authors.filter((_, i) => i !== index))
    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-4">Authors & Contributors</h3>
            <div className="space-y-4">
                {authors.map((author, index) => (
                    <div key={index} className="p-4 bg-gray-800/30 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Full Name *" value={author.name} onChange={(e) => handleAuthorChange(index, 'name', e.target.value)} className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"/>
                        <input placeholder="Wallet Address (Optional)" value={author.wallet || ''} onChange={(e) => handleAuthorChange(index, 'wallet', e.target.value)} className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"/>
                        {authors.length > 1 && (
                             <button type="button" onClick={() => removeAuthor(index)} className="md:col-start-2 justify-self-end flex items-center gap-1 text-sm text-red-400 hover:text-red-300">
                                 <TrashIcon className="w-4 h-4" /> Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button type="button" onClick={addAuthor} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm text-cyan-300 bg-cyan-900/50 rounded-full hover:bg-cyan-900">
                <PlusIcon className="w-4 h-4"/> Add Another Author
            </button>
        </div>
    )
}

export default AuthorsEditor;

