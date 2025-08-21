'use client'

type StepperProps = { steps: string[]; active: number }

export default function Stepper({ steps, active }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8 text-xs sm:text-sm">
      {steps.map((s, i) => (
        <div key={s} className={`px-3 py-1 rounded-full ${i === active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{i + 1}</div>
      ))}
    </div>
  )
}


