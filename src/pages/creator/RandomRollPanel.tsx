import { ATTRIBUTE_FIELDS } from "./types";
import AttributeInput from "./AttributeInput";
import type { Attributes } from "../../shared/storage/types";

export default function RandomRollPanel({ attributes, onAttributeChange, onReroll }: { attributes: Attributes; onAttributeChange: (key: keyof Attributes, val: number) => void; onReroll: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-stone-400 text-sm">4d6 取最高 3 个，已按从高到低排序</div>
        <button onClick={onReroll} className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-md transition-colors text-sm font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          重新投掷
        </button>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTE_FIELDS.map((field) => <AttributeInput key={field.key} label={field.label} abbr={field.abbr} value={attributes[field.key]} onChange={(val) => onAttributeChange(field.key, val)} />)}
      </div>
      <div className="mt-3 text-stone-500 text-xs text-center">生成后可自行调整各属性值</div>
    </div>
  );
}