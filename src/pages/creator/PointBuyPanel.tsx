import { useMemo } from "react";
import { POINT_BUY_COST, POINT_BUY_TOTAL, ATTRIBUTE_FIELDS } from "./types";
import AttributeInput from "./AttributeInput";
import type { Attributes } from "../../shared/storage/types";

export default function PointBuyPanel({ attributes, onAttributeChange }: { attributes: Attributes; onAttributeChange: (key: keyof Attributes, val: number) => void }) {
  const usedPoints = useMemo(() => ATTRIBUTE_FIELDS.reduce((sum, f) => sum + (POINT_BUY_COST[attributes[f.key]] ?? 0), 0), [attributes]);
  const remaining = POINT_BUY_TOTAL - usedPoints;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-stone-400 text-sm">已用点数: <span className="text-amber-400 font-bold">{usedPoints}</span> / {POINT_BUY_TOTAL}</div>
        <div className={"text-sm font-bold " + (remaining >= 0 ? "text-emerald-400" : "text-red-400")}>剩余: {remaining}</div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTE_FIELDS.map((field) => <AttributeInput key={field.key} label={field.label} abbr={field.abbr} value={attributes[field.key]} onChange={(val) => onAttributeChange(field.key, val)} min={8} max={15} remainingPoints={remaining} />)}
      </div>
      <div className="mt-3 text-stone-500 text-xs text-center">每项属性范围 8-15，27 点购点（参考玩家手册）</div>
    </div>
  );
}