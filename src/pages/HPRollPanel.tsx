import { useState, useCallback, useMemo } from "react";

interface HPRollPanelProps {
  className: string;
  level: number;
  conValue: number;
  onHPChange: (current: number, max: number) => void;
}

/** 根据职业名获取生命骰面数 */
function getHitDieSize(className: string): number {
  const hitDieMap: Record<string, number> = {
    "法师": 6, "术士": 6, "邪术师": 8,
    "牧师": 8, "德鲁伊": 8, "游荡者": 8, "武僧": 8,
    "诗人": 8, "契术师": 8,
    "战士": 10, "圣武士": 10, "游侠": 10,
    "野蛮人": 12,
  };
  return hitDieMap[className] ?? 8;
}

function calcMod(val: number): number {
  return Math.floor((val - 10) / 2);
}

export default function HPRollPanel({ className, level, conValue, onHPChange }: HPRollPanelProps) {
  const hitDieSize = useMemo(() => getHitDieSize(className), [className]);
  const conMod = useMemo(() => calcMod(conValue), [conValue]);

  const [rolls, setRolls] = useState<number[]>([]);
  const [totalHP, setTotalHP] = useState(0);
  const [rolled, setRolled] = useState(false);

  const handleRoll = useCallback(() => {
    const newRolls: number[] = [];
    // 第1级取最大值
    let total = hitDieSize + conMod;
    newRolls.push(hitDieSize);

    // 后续等级投掷
    for (let i = 1; i < level; i++) {
      const roll = Math.floor(Math.random() * hitDieSize) + 1;
      newRolls.push(roll);
      total += roll + conMod;
    }

    setRolls(newRolls);
    setTotalHP(Math.max(total, level)); // 至少1级1血
    setRolled(true);
    onHPChange(total, total);
  }, [hitDieSize, conMod, level, onHPChange]);

  const handleManualSet = useCallback((value: number) => {
    const clamped = Math.max(level, value);
    setTotalHP(clamped);
    setRolled(true);
    onHPChange(clamped, clamped);
  }, [level, onHPChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-stone-400 text-sm">职业: </span>
          <span className="text-amber-300 font-medium">{className}</span>
        </div>
        <div>
          <span className="text-stone-400 text-sm">生命骰: </span>
          <span className="text-amber-300 font-medium">d{hitDieSize}</span>
        </div>
        <div>
          <span className="text-stone-400 text-sm">体质调整值: </span>
          <span className="text-amber-300 font-medium">{conMod >= 0 ? "+" + conMod : conMod}</span>
        </div>
      </div>

      {!rolled ? (
        <div className="text-center py-6">
          <p className="text-stone-400 text-sm mb-4">
            点击下方按钮投掷生命值（第1级取最大值 d{hitDieSize}，后续等级投掷 d{hitDieSize} + 体质调整值）
          </p>
          <button
            onClick={handleRoll}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg transition-colors font-medium"
          >
            投掷生命值
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-stone-900/50 rounded-lg p-4">
            <div className="text-stone-400 text-xs mb-2">投掷结果</div>
            <div className="flex flex-wrap gap-2">
              {rolls.map((roll, index) => (
                <div
                  key={index}
                  className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-300 font-bold text-sm"
                  title={index === 0 ? "第1级（最大值）" : `第${index + 1}级`}
                >
                  {roll}
                </div>
              ))}
            </div>
            <div className="mt-3 text-stone-500 text-xs">
              每级 + 体质调整值 ({conMod >= 0 ? "+" + conMod : conMod})
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-stone-400 text-sm">总生命值: </span>
              <span className="text-amber-300 text-xl font-bold">{totalHP}</span>
            </div>
            <button
              onClick={handleRoll}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors text-sm"
            >
              重新投掷
            </button>
          </div>

          <div className="border-t border-stone-700/50 pt-4">
            <label className="block text-stone-400 text-xs mb-2">或手动设置生命值</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={totalHP}
                min={level}
                max={hitDieSize * level + conMod * level}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v)) handleManualSet(v);
                }}
                className="w-24 px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm text-center"
              />
              <span className="text-stone-500 text-xs">（最小 {level}，建议 {hitDieSize + conMod + (level - 1) * Math.ceil(hitDieSize / 2 + conMod)}）</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}