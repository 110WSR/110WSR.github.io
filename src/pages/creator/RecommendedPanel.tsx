import { RECOMMENDED_BUILDS, ATTRIBUTE_FIELDS } from "./types";
import type { Attributes } from "../../shared/storage/types";

export default function RecommendedPanel({ onSelectBuild }: { onSelectBuild: (attrs: Attributes) => void }) {
  return (
    <div>
      <div className="text-stone-400 text-sm mb-4">选择一个职业推荐属性配置：</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {RECOMMENDED_BUILDS.map((build) => (
          <button key={build.label} onClick={() => onSelectBuild(build.attrs)} className="text-left px-4 py-3 rounded-lg bg-stone-800/50 hover:bg-stone-700/50 border border-stone-700/50 hover:border-amber-600/50 transition-all duration-200 group">
            <div className="text-stone-300 group-hover:text-amber-300 text-sm font-medium mb-1.5">{build.label}</div>
            <div className="flex gap-1.5">{ATTRIBUTE_FIELDS.map((field) => <span key={field.key} className="text-xs px-1.5 py-0.5 rounded bg-stone-900 text-stone-400" title={field.label}>{field.abbr}:{build.attrs[field.key]}</span>)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}