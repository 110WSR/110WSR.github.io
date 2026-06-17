import { ALIGNMENT_OPTIONS } from "./types";
import type { Personality } from "../../shared/storage/types";

export default function CharacterDetailsPanel({ alignment, onAlignmentChange, personality, onPersonalityChange, backstory, onBackstoryChange }: {
  alignment: string; onAlignmentChange: (a: string) => void; personality: Personality; onPersonalityChange: (p: Personality) => void; backstory: string; onBackstoryChange: (t: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div><h3 className="text-amber-300 text-sm font-semibold mb-3">阵营</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {ALIGNMENT_OPTIONS.map((a) => (
            <button key={a} onClick={() => onAlignmentChange(a)} className={"px-3 py-2 rounded-md text-xs transition-all duration-200 " + (alignment === a ? "bg-amber-700/50 text-amber-200 border border-amber-600/50" : "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50")}>{a}</button>
          ))}
        </div>
      </div>
      <div><h3 className="text-amber-300 text-sm font-semibold mb-3">个性特征</h3>
        <div className="space-y-3">
          {(["个性特点", "理想", "牵绊", "缺点"] as const).map((field) => (
            <div key={field}>
              <label className="block text-stone-400 text-xs mb-1">{field}</label>
              <textarea value={personality[field]} onChange={(e) => onPersonalityChange({ ...personality, [field]: e.target.value })} placeholder={"输入角色的" + field + "..."} rows={2} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm resize-none" />
            </div>
          ))}
        </div>
      </div>
      <div><h3 className="text-amber-300 text-sm font-semibold mb-3">背景故事</h3>
        <textarea value={backstory} onChange={(e) => onBackstoryChange(e.target.value)} placeholder="输入角色的背景故事..." rows={4} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm resize-none" />
      </div>
    </div>
  );
}