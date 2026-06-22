import { useState, useCallback, useMemo } from "react";
import classData from "../../data/classData.json";

interface HPRollPanelProps {
  classId: string;
  level: number;
  conValue: number;
  onHPChange: (current: number, max: number) => void;
}

/** 根据职业ID获取生命骰面数 */
function getHitDieSize(classId: string): number {
  const entry = (classData as Record<string, any>)[classId];
  return entry?.hitpoints?.[0] ?? 8;
}

/** 根据职业ID获取每级固定成长值（平均值向上取整） */
function getFixedGrowth(classId: string): number {
  const entry = (classData as Record<string, any>)[classId];
  return entry?.hitpoints?.[1] ?? 5;
}

function calcMod(val: number): number {
  return Math.floor((val - 10) / 2);
}

/** 每级增加量的记录 */
interface LevelGain {
  level: number;
  type: "fixed" | "rolled";
  value: number; // 骰子结果（不含体质调整值）
}

export default function HPRollPanel({ classId, level, conValue, onHPChange }: HPRollPanelProps) {
  const hitDieSize = useMemo(() => getHitDieSize(classId), [classId]);
  const fixedGrowth = useMemo(() => getFixedGrowth(classId), [classId]);
  const conMod = useMemo(() => calcMod(conValue), [conValue]);

  // 每级的增加量记录（从第2级开始）
  const [levelGains, setLevelGains] = useState<LevelGain[]>([]);
  const [rolled, setRolled] = useState(false);

  /** 计算当前总生命值 */
  const totalHP = useMemo(() => {
    // 第1级：生命骰最大值 + 体质调整值
    const firstLevel = hitDieSize + conMod;
    // 第2级及以后：累加每级的增加量（每级增加量 = 骰子值 + 体质调整值）
    const gains = levelGains.reduce((sum, g) => sum + g.value + conMod, 0);
    return firstLevel + gains;
  }, [hitDieSize, conMod, levelGains]);

  /** 全部投掷骰子 */
  const handleRollAll = useCallback(() => {
    const newGains: LevelGain[] = [];
    for (let i = 2; i <= level; i++) {
      const roll = Math.floor(Math.random() * hitDieSize) + 1;
      newGains.push({ level: i, type: "rolled", value: roll });
    }
    setLevelGains(newGains);
    setRolled(true);
    // 计算新总生命值并回调
    const firstLevel = hitDieSize + conMod;
    const gains = newGains.reduce((sum, g) => sum + g.value + conMod, 0);
    const total = firstLevel + gains;
    onHPChange(total, total);
  }, [hitDieSize, level, conMod, onHPChange]);

  /** 全部使用固定值 */
  const handleUseFixed = useCallback(() => {
    const newGains: LevelGain[] = [];
    for (let i = 2; i <= level; i++) {
      newGains.push({ level: i, type: "fixed", value: fixedGrowth });
    }
    setLevelGains(newGains);
    setRolled(true);
    const firstLevel = hitDieSize + conMod;
    const gains = newGains.reduce((sum, g) => sum + g.value + conMod, 0);
    const total = firstLevel + gains;
    onHPChange(total, total);
  }, [fixedGrowth, hitDieSize, level, conMod, onHPChange]);

  /** 重新投掷某一级 */
  const handleRerollLevel = useCallback((levelIndex: number) => {
    setLevelGains((prev) => {
      const newGains = prev.map((g) =>
        g.level === levelIndex
          ? { ...g, type: "rolled" as const, value: Math.floor(Math.random() * hitDieSize) + 1 }
          : g
      );
      // 更新回调
      const firstLevel = hitDieSize + conMod;
      const gains = newGains.reduce((sum, g) => sum + g.value + conMod, 0);
      const total = firstLevel + gains;
      onHPChange(total, total);
      return newGains;
    });
  }, [hitDieSize, conMod, onHPChange]);

  /** 切换某一级为固定值 */
  const handleSetFixed = useCallback((levelIndex: number) => {
    setLevelGains((prev) => {
      const newGains = prev.map((g) =>
        g.level === levelIndex ? { ...g, type: "fixed" as const, value: fixedGrowth } : g
      );
      const firstLevel = hitDieSize + conMod;
      const gains = newGains.reduce((sum, g) => sum + g.value + conMod, 0);
      const total = firstLevel + gains;
      onHPChange(total, total);
      return newGains;
    });
  }, [fixedGrowth, hitDieSize, conMod, onHPChange]);

  /** 手动设置总生命值 */
  const handleManualSet = useCallback((value: number) => {
    const clamped = Math.max(level, value);
    const firstLevel = hitDieSize + conMod;
    const remaining = clamped - firstLevel;
    const perLevel = Math.max(1, Math.floor(remaining / Math.max(1, level - 1)));
    const newGains: LevelGain[] = [];
    for (let i = 2; i <= level; i++) {
      newGains.push({ level: i, type: "fixed", value: Math.max(1, perLevel) });
    }
    setLevelGains(newGains);
    setRolled(true);
    onHPChange(clamped, clamped);
  }, [hitDieSize, conMod, level, onHPChange]);

  /** 计算建议生命值（使用固定成长值） */
  const suggestedHP = useMemo(() => {
    return hitDieSize + (level - 1) * fixedGrowth + conMod * level;
  }, [hitDieSize, level, fixedGrowth, conMod]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-stone-400 text-sm">生命骰: </span>
          <span className="text-amber-300 font-medium">d{hitDieSize}</span>
        </div>
        <div>
          <span className="text-stone-400 text-sm">每级固定成长: </span>
          <span className="text-amber-300 font-medium">{fixedGrowth}</span>
        </div>
        <div>
          <span className="text-stone-400 text-sm">体质调整值: </span>
          <span className="text-amber-300 font-medium">{conMod >= 0 ? "+" + conMod : conMod}</span>
        </div>
      </div>

      {!rolled ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-stone-400 text-sm">
            第1级取最大值 d{hitDieSize}（{hitDieSize}），之后每级可选择固定值或投掷骰子
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleRollAll}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg transition-colors font-medium"
            >
              全部投掷骰子
            </button>
            <button
              onClick={handleUseFixed}
              className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors font-medium"
            >
              全部使用固定值（{fixedGrowth}）
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 第1级（固定最大值） */}
          <div className="bg-stone-900/50 rounded-lg p-4">
            <div className="text-stone-400 text-xs mb-2">生命值构成（累加）</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-2 rounded-lg bg-amber-900/30 border border-amber-700/50 text-amber-300 font-bold text-sm">
                第1级: {hitDieSize}（最大值）
              </div>
              <span className="text-stone-500 text-xs">+ 体质调整值 ({conMod >= 0 ? "+" + conMod : conMod})</span>
            </div>
          </div>

          {/* 第2级及以后的每级增加量 */}
          {level > 1 && (
            <div className="bg-stone-900/50 rounded-lg p-4">
              <div className="text-stone-400 text-xs mb-2">每级增加量（第2级 ~ 第{level}级）</div>
              <div className="flex flex-wrap gap-2">
                {levelGains.map((gain) => (
                  <div key={gain.level} className="relative group">
                    <div
                      className={`px-3 py-2 rounded-lg border text-sm font-bold flex items-center gap-1 ${
                        gain.type === "fixed"
                          ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-300"
                          : "bg-amber-900/30 border-amber-700/50 text-amber-300"
                      }`}
                      title={`第${gain.level}级: ${gain.type === "fixed" ? "固定值" : "投掷值"} ${gain.value}`}
                    >
                      <span className="text-xs text-stone-500 mr-1">Lv{gain.level}</span>
                      {gain.value}
                      <span className="text-xs text-stone-500 ml-1">d{hitDieSize}</span>
                    </div>
                    {/* 悬停时显示切换按钮 */}
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 hidden group-hover:flex gap-1">
                      {gain.type === "rolled" && (
                        <button
                          onClick={() => handleSetFixed(gain.level)}
                          className="w-5 h-5 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs flex items-center justify-center"
                          title="切换为固定值"
                        >
                          F
                        </button>
                      )}
                      <button
                        onClick={() => handleRerollLevel(gain.level)}
                        className="w-5 h-5 rounded-full bg-amber-700 hover:bg-amber-600 text-white text-xs flex items-center justify-center"
                        title="重新投掷"
                      >
                        R
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-stone-500 text-xs">
                每级增加量 + 体质调整值 ({conMod >= 0 ? "+" + conMod : conMod})
              </div>
            </div>
          )}

          {/* 总生命值 */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-stone-400 text-sm">总生命值: </span>
              <span className="text-amber-300 text-xl font-bold">{totalHP}</span>
              <span className="text-stone-500 text-xs ml-2">
                = {hitDieSize} + {levelGains.map(g => g.value).join(" + ")} + {conMod} × {level}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRollAll}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors text-xs"
              >
                全部重投
              </button>
              <button
                onClick={handleUseFixed}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors text-xs"
              >
                全部固定值
              </button>
            </div>
          </div>

          {/* 手动设置 */}
          <div className="border-t border-stone-700/50 pt-4">
            <label className="block text-stone-400 text-xs mb-2">或手动设置总生命值</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={totalHP}
                min={level}
                max={hitDieSize + (level - 1) * hitDieSize + conMod * level}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v)) handleManualSet(v);
                }}
                className="w-24 px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm text-center"
              />
              <span className="text-stone-500 text-xs">（最小 {level}，建议 {suggestedHP}）</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}