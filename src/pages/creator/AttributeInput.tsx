import { POINT_BUY_COST, calcMod } from "./types";

export default function AttributeInput({ label, abbr, value, onChange, min = 3, max = 18, remainingPoints }: {
  label: string; abbr: string; value: number; onChange: (val: number) => void; min?: number; max?: number; remainingPoints?: number;
}) {
  const mod = calcMod(value);
  const canDecrease = value > min;
  const canIncrease = value < max && (remainingPoints === undefined || (POINT_BUY_COST[value + 1] !== undefined && remainingPoints >= POINT_BUY_COST[value + 1]));
  return (
    <div className="flex flex-col items-center bg-stone-800/50 rounded-lg p-3 border border-stone-700/50 min-w-[90px]">
      <div className="text-amber-400/80 text-xs font-semibold tracking-wider mb-1">{abbr}</div>
      <div className="text-stone-400 text-xs mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => canDecrease && onChange(value - 1)} disabled={!canDecrease} className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 flex items-center justify-center transition-colors text-sm font-bold">-</button>
        <div className="relative">
          <input type="number" value={value} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= min && v <= max) onChange(v); }} className="w-14 h-10 text-center bg-stone-900 border border-stone-600 rounded text-amber-100 font-bold text-lg outline-none focus:border-amber-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none" />
          <div className="absolute -bottom-4 left-0 right-0 text-center text-xs text-stone-500">{mod}</div>
        </div>
        <button onClick={() => canIncrease && onChange(value + 1)} disabled={!canIncrease} className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 flex items-center justify-center transition-colors text-sm font-bold">+</button>
      </div>
    </div>
  );
}