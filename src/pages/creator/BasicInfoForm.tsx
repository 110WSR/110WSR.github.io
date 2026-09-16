import { useState, useEffect } from "react";
import { CLASS_OPTIONS, RACE_OPTIONS, BACKGROUND_OPTIONS } from "./types";
import {
  getRaceOptions,
  getBackgroundOptions,
  getClassOptions,
  getAncestryLabel,
  subscribeExpansions,
} from "../../shared/utils/rulesService";

/** 订阅规则扩充开关变化，开关后建卡选项实时更新 */
function useExpansionVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => subscribeExpansions(() => setV((x) => x + 1)), []);
  return v;
}

export default function BasicInfoForm({ name, onNameChange, className: classValue, onClassChange, race, onRaceChange, background, onBackgroundChange, level, onLevelChange }: {
  name: string; onNameChange: (v: string) => void; className: string; onClassChange: (v: string) => void; race: string; onRaceChange: (v: string) => void; background: string; onBackgroundChange: (v: string) => void; level: number; onLevelChange: (v: number) => void;
}) {
  useExpansionVersion();

  // 规则服务取基础规则集+已启用扩充；数据异常时回退到旧硬编码常量
  let races = RACE_OPTIONS, backgrounds = BACKGROUND_OPTIONS, classes = CLASS_OPTIONS;
  let ancestryLabel = "种族";
  try {
    races = getRaceOptions();
    backgrounds = getBackgroundOptions();
    classes = getClassOptions();
    ancestryLabel = getAncestryLabel();
  } catch { /* 回退旧常量 */ }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-stone-400 text-xs tracking-wider mb-1.5">角色名</label><input type="text" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="输入角色名..." className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm" /></div>
        <div><label className="block text-stone-400 text-xs tracking-wider mb-1.5">等级</label>
          <div className="flex items-center gap-2">
            <button onClick={() => onLevelChange(Math.max(1, level - 1))} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center">-</button>
            <input type="number" value={level} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 20) onLevelChange(v); }} className="w-16 h-8 text-center bg-stone-900 border border-stone-700 rounded text-amber-100 font-bold outline-none focus:border-amber-600/50 text-sm" />
            <button onClick={() => onLevelChange(Math.min(20, level + 1))} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center">+</button>
          </div>
        </div>
        <div><label className="block text-stone-400 text-xs tracking-wider mb-1.5">职业</label>
          <select value={classValue} onChange={(e) => onClassChange(e.target.value)} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer">
            <option value="">选择职业...</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="block text-stone-400 text-xs tracking-wider mb-1.5">{ancestryLabel}</label>
          <select value={race} onChange={(e) => onRaceChange(e.target.value)} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer">
            <option value="">选择{ancestryLabel}...</option>
            {races.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="block text-stone-400 text-xs tracking-wider mb-1.5">背景</label>
          <select value={background} onChange={(e) => onBackgroundChange(e.target.value)} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer">
            <option value="">选择背景...</option>
            {backgrounds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
