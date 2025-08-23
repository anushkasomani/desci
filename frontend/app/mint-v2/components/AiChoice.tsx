'use client'
const AiChoice: React.FC<{ value: boolean | null; onChange: (v: boolean) => void; onBack: () => void; onNext: () => void }> = ({ value, onChange, onBack, onNext }) => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use AI to help structure your submission?</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button onClick={() => onChange(true)} className={`p-6 rounded-xl border transition-all ${value === true ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-300 hover:shadow-md"}`}>
        Yes, assist me with AI
      </button>
      <button onClick={() => onChange(false)} className={`p-6 rounded-xl border transition-all ${value === false ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-300 hover:shadow-md"}`}>
        No, I will fill forms manually
      </button>
    </div>
    <div className="mt-6 flex justify-between">
      <button onClick={onBack} className="px-5 py-2 rounded-lg border">Back</button>
      <button disabled={value === null} onClick={onNext} className={`px-5 py-2 rounded-lg text-white ${value !== null ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}>
        Continue
      </button>
    </div>
  </div>
);
export default AiChoice;