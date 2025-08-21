'use client'
import { IpType } from '../types'

type Props = { value: IpType | null; onChange: (t: IpType) => void; onNext: () => void }

const options: { key: IpType; label: string; desc: string }[] = [
  { key: 'research_paper', label: 'Research Paper', desc: 'PDF, DOCX, manuscript or preprint' },
  { key: 'dataset', label: 'Dataset', desc: 'CSV, JSON, Parquet, etc.' },
  { key: 'formula_method', label: 'Formula / Method', desc: 'LaTeX, markdown, notebooks' },
  { key: 'other', label: 'Other', desc: 'Anything else' },
]

export default function ChooseType({ value, onChange, onNext }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">What is your IP type?</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {options.map(opt => (
          <button key={opt.key} onClick={() => onChange(opt.key)} className={`p-6 rounded-xl border text-left transition-all ${value === opt.key ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
            <div className="text-lg font-medium text-gray-800">{opt.label}</div>
            <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button disabled={!value} onClick={onNext} className={`px-5 py-2 rounded-lg text-white ${value ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}>Continue</button>
      </div>
    </div>
  )
}


