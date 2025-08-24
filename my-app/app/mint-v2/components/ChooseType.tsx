'use client'
import { IpType } from "../../types/mint";
import { DocumentTextIcon, CircleStackIcon, BeakerIcon, SparklesIcon } from "@heroicons/react/24/outline";
const options = [
    { key: "research_paper" as IpType, label: "Research Paper", desc: "PDF, manuscript or preprint", icon: DocumentTextIcon },
    { key: "dataset" as IpType, label: "Dataset", desc: "CSV, JSON, Parquet, etc.", icon: CircleStackIcon },
    { key: "formula_method" as IpType, label: "Formula / Method", desc: "Chemical structures, algorithms", icon: BeakerIcon },
    { key: "other" as IpType, label: "Other", desc: "Any other form of IP", icon: SparklesIcon }
];
type Props = { onSelect: (type: IpType) => void }
export function ChooseType({ onSelect }: Props) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Select your IP Type</h2>
            <p className="text-gray-400 mb-8">What kind of intellectual property are you tokenizing today?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map(opt => (
                    <button key={opt.key} onClick={() => onSelect(opt.key)} className="group text-left p-6 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-gray-800 transition-all">
                        <opt.icon className="w-8 h-8 text-cyan-400 mb-3" />
                        <h3 className="text-lg font-bold text-white">{opt.label}</h3>
                        <p className="text-sm text-gray-500">{opt.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}
export default ChooseType;