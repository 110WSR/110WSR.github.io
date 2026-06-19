import { useState, useMemo } from "react";

/** 子职特性接口 */
export interface SubclassFeature {
  level: number;
  name: string;
  description: string;
}

/** 子职选项接口 */
export interface SubclassOption {
  id: string;
  name: string;
  description: string;
  features: SubclassFeature[];
}

/** 子职数据文件接口 */
export interface SubclassData {
  className: string;
  label: string;
  level: number;
  options: SubclassOption[];
}

/** 中文职业名到文件名的映射 */
const CLASS_FILE_MAP: Record<string, string> = {
  "野蛮人": "barbarian",
  "吟游诗人": "bard",
  "牧师": "cleric",
  "德鲁伊": "druid",
  "战士": "fighter",
  "武僧": "monk",
  "圣武士": "paladin",
  "游侠": "ranger",
  "游荡者": "rogue",
  "术士": "sorcerer",
  "邪术师": "warlock",
  "法师": "wizard",
};

interface SubclassSelectionPanelProps {
  className: string;
  level: number;
  selectedSubclass: string;
  onSubclassChange: (subclassId: string, features: SubclassFeature[]) => void;
}

export default function SubclassSelectionPanel({
  className,
  level,
  selectedSubclass,
  onSubclassChange,
}: SubclassSelectionPanelProps) {
  const [subclassData, setSubclassData] = useState<SubclassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载子职数据
  useMemo(() => {
    if (!className) return;
    const fileName = CLASS_FILE_MAP[className];
    if (!fileName) return;

    setLoading(true);
    setError(null);

    import(`../../../data/subclasses/${fileName}.json`)
      .then((module) => {
        setSubclassData(module.default as SubclassData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("加载子职数据失败:", err);
        setError("加载子职数据失败");
        setLoading(false);
      });
  }, [className]);

  // 检查是否达到子职等级
  const subclassLevel = subclassData?.level ?? 99;
  const hasReachedLevel = level >= subclassLevel;

  // 获取当前选择的子职对象
  const selectedOption = useMemo(() => {
    if (!subclassData || !selectedSubclass) return null;
    return subclassData.options.find((o) => o.id === selectedSubclass) ?? null;
  }, [subclassData, selectedSubclass]);

  // 获取当前等级可用的特性
  const availableFeatures = useMemo(() => {
    if (!selectedOption) return [];
    return selectedOption.features.filter((f) => f.level <= level);
  }, [selectedOption, level]);

  if (!className) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">请先在基本信息中选择职业</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">加载子职数据中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!subclassData) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">该职业暂无子职数据</p>
      </div>
    );
  }

  if (!hasReachedLevel) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
        <h2 className="text-amber-300 text-lg font-semibold mb-4">{subclassData.label}</h2>
        <div className="bg-stone-900/50 rounded-lg p-4 text-center">
          <p className="text-stone-400 text-sm">
            你的职业将在第 <span className="text-amber-300 font-bold">{subclassLevel}</span> 级获得{subclassData.label}
          </p>
          <p className="text-stone-500 text-xs mt-2">当前等级 {level} 级，尚未达到要求</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
        <h2 className="text-amber-300 text-lg font-semibold mb-2">选择{subclassData.label}</h2>
        <p className="text-stone-400 text-sm mb-4">
          你的职业将在第 {subclassLevel} 级获得{subclassData.label}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subclassData.options.map((option) => {
            const isSelected = selectedSubclass === option.id;
            return (
              <button
                key={option.id}
                onClick={() => onSubclassChange(option.id, option.features)}
                className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                  isSelected
                    ? "bg-amber-700/30 border-amber-500/50 text-amber-200"
                    : "bg-stone-800/50 border-stone-700/50 text-stone-300 hover:border-stone-600/50"
                }`}
              >
                <div className="font-medium text-sm mb-1">{option.name}</div>
                <div className="text-xs text-stone-400 leading-relaxed">{option.description}</div>
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-amber-700/30">
                    <div className="text-[11px] text-amber-400/80 font-medium mb-1">已获得特性：</div>
                    {option.features
                      .filter((f) => f.level <= level)
                      .map((f, i) => (
                        <div key={i} className="text-[11px] text-stone-400 mb-0.5">
                          <span className="text-amber-300/70">Lv.{f.level}</span> {f.name}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedOption && availableFeatures.length > 0 && (
        <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
          <h3 className="text-amber-300 text-base font-semibold mb-3">
            {selectedOption.name} - 特性详情
          </h3>
          <div className="space-y-3">
            {availableFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-stone-900/50 rounded-lg p-3 border border-stone-700/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-700/30 text-amber-300/80 font-medium">
                    Lv.{feature.level}
                  </span>
                  <span className="text-amber-200 text-sm font-medium">{feature.name}</span>
                </div>
                <p className="text-stone-400 text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}