import React from "react";

const StepBadge: React.FC<{ index: number; active: boolean; label: string }> = ({ index, active, label }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
    <span className="text-xs font-semibold">{index + 1}</span>
    <span className="hidden sm:inline text-xs">{label}</span>
  </div>
);

export default StepBadge;
