import { useMemo } from "react";
import spellData from "../../../data/spellData.json";
import classStructuredData from "../../../5E_Classes_Structured.json";

/** 法术选择面板属性 */
interface SpellSelectionPanelProps {
  className: string;
  level: number;
  selectedSubclass: string;
  subclassFeatures: { level: number; name: string; description: string }[];
  selectedSpells: Record<string, string[]>; // { "0": ["法术1", "法术2"], "1": ["法术3"] }
  onSpellsChange: (spells: Record<string, string[]>) => void;
}

/** 中文职业名到spellData中key的映射 */
const CLASS_NAME_MAP: Record<string, string> = {
  "野蛮人": "野蛮人",
  "吟游诗人": "吟游诗人",
  "牧师": "牧师",
  "德鲁伊": "德鲁伊",
  "战士": "战士",
  "武僧": "武僧",
  "圣武士": "圣武士",
  "游侠": "游侠",
  "游荡者": "游荡者",
  "术士": "术士",
  "邪术师": "邪术师",
  "法师": "法师",
  "奇械师": "奇械师",
  "血猎手": "血猎手",
};

/** 各职业已知法术数量（戏法/法术）- 基于5e6.txt官方数据 */
const CLASS_SPELL_COUNTS: Record<string, { cantrips: number[]; spells: Record<number, number> }> = {
  "吟游诗人": { cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], spells: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22 } },
  "牧师": { cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], spells: {} },
  "德鲁伊": { cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], spells: {} },
  "圣武士": { cantrips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], spells: {} },
  "游侠": { cantrips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], spells: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 11, 12: 11, 13: 12, 14: 12, 15: 12, 16: 13, 17: 13, 18: 13, 19: 14, 20: 14 } },
  "术士": { cantrips: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], spells: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 } },
  "邪术师": { cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], spells: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15 } },
  "法师": { cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], spells: {} },
};

/** 各职业快速建卡推荐法术（基于5e6.txt） */
const QUICK_BUILD_SPELLS: Record<string, { cantrips: string[]; level1: string[] }> = {
  "吟游诗人": { cantrips: ["舞光术", "恶言相加"], level1: ["魅惑人类", "疗伤术", "睡眠术", "雷鸣波"] },
  "牧师": { cantrips: ["光亮术", "神导术", "圣火术"], level1: ["祝福术", "疗伤术", "圣焰斩", "命令术"] },
  "德鲁伊": { cantrips: ["德鲁伊伎俩", "神导术"], level1: ["疗伤术", "纠缠术", "妖火", "橡棍术"] },
  "圣武士": { cantrips: [], level1: ["祝福术", "疗伤术", "圣焰斩", "防护善恶"] },
  "游侠": { cantrips: [], level1: ["猎人印记", "疗伤术", "动物交谈术", "云雾术"] },
  "术士": { cantrips: ["火焰箭", "法师之手", "冰冻射线", "恶言相加"], level1: ["燃烧之手", "魅惑人类", "法师护甲", "魔法飞弹"] },
  "邪术师": { cantrips: ["魔能爆", "恶言相加"], level1: ["魅惑人类", "地狱叱喝", "法师护甲", "魔石术"] },
  "法师": { cantrips: ["法师之手", "光亮术", "火焰箭"], level1: ["燃烧之手", "魅惑人类", "法师护甲", "魔法飞弹", "护盾术", "睡眠术"] },
};

/** 从子职特性描述中提取法术名称 */
function extractSpellsFromFeature(description: string): string[] {
  const spells: string[] = [];
  const matches = description.match(/[\u4e00-\u9fff]{2,6}(?:术|咒|波|击|弹|矢|息|环|墙|云|雾|眼|手|指|步|语|光|刃|甲|袍|袋|球|枪|锤|斧|剑|弓|盾|符|印|徽|令)/g);
  if (matches) {
    for (const m of matches) {
      if (!spells.includes(m)) spells.push(m);
    }
  }
  return spells;
}

export default function SpellSelectionPanel({
  className,
  level,
  subclassFeatures,
  selectedSpells,
  onSpellsChange,
}: SpellSelectionPanelProps) {
  const classKey = CLASS_NAME_MAP[className] || className;
  const classSpells = (spellData as Record<string, Record<string, string[]>>)[classKey];
  
  // 从5E_Classes_Structured.json获取当前职业当前等级的数据
  const classLevelData = useMemo(() => {
    const data = (classStructuredData as Record<string, any[]>)[classKey];
    if (!data) return null;
    return data.find((entry: any) => entry["等级"] === level) || null;
  }, [classKey, level]);

  // 从结构化数据中获取各环法术位
  const spellSlotsByLevel = useMemo(() => {
    if (!classLevelData) return {};
    const slots: Record<string, number> = {};
    for (let i = 1; i <= 9; i++) {
      const key = `${i}环`;
      const val = classLevelData[key];
      if (val !== null && val !== undefined && val > 0) {
        slots[String(i)] = val;
      }
    }
    return slots;
  }, [classLevelData]);

  // 获取职业可用的最高法术环阶
  const maxSpellLevel = useMemo(() => {
    const levels = Object.keys(spellSlotsByLevel).map(Number);
    return levels.length > 0 ? Math.max(...levels) : 0;
  }, [spellSlotsByLevel]);

  // 获取职业已知法术/戏法数量
  const spellCounts = CLASS_SPELL_COUNTS[classKey];
  const maxCantrips = classLevelData?.["已知戏法"] ?? spellCounts?.cantrips[level - 1] ?? 0;
  const maxSpells = classLevelData?.["已知法术"] ?? spellCounts?.spells[level] ?? 0;
  
  // 是否是准备施法职业
  const isPreparedCaster = ["牧师", "德鲁伊", "圣武士", "法师"].includes(classKey);
  
  // 快速建卡推荐法术
  const quickBuildSpells = QUICK_BUILD_SPELLS[classKey];
  
  // 从子职特性中提取额外法术
  const extraSpells = useMemo(() => {
    const extras: { level: number; spells: string[] }[] = [];
    if (!subclassFeatures || subclassFeatures.length === 0) return extras;
    
    for (const feature of subclassFeatures) {
      if (feature.level <= level) {
        if (feature.name.includes("法术") || feature.name.includes("领域法术") || feature.name.includes("誓言法术")) {
          const extracted = extractSpellsFromFeature(feature.description);
          if (extracted.length > 0) {
            extras.push({ level: feature.level, spells: extracted });
          }
        }
      }
    }
    return extras;
  }, [subclassFeatures, level]);
  
  // 合并所有额外法术
  const allExtraSpells = useMemo(() => {
    const set = new Set<string>();
    for (const extra of extraSpells) {
      for (const s of extra.spells) set.add(s);
    }
    return Array.from(set);
  }, [extraSpells]);
  
  // 获取所有可用的法术环阶
  const availableLevels = useMemo(() => {
    const levels: string[] = [];
    if (classSpells?.["0"] && maxCantrips > 0) levels.push("0");
    for (let i = 1; i <= maxSpellLevel; i++) {
      if (classSpells?.[String(i)] && classSpells[String(i)].length > 0) {
        levels.push(String(i));
      }
    }
    return levels;
  }, [classSpells, maxSpellLevel, maxCantrips]);
  
  // 切换法术选择
  const toggleSpell = (level: string, spellName: string) => {
    const current = selectedSpells[level] || [];
    let newSpells: Record<string, string[]>;
    
    if (current.includes(spellName)) {
      newSpells = { ...selectedSpells, [level]: current.filter(s => s !== spellName) };
    } else {
      newSpells = { ...selectedSpells, [level]: [...current, spellName] };
    }
    onSpellsChange(newSpells);
  };
  
  // 获取当前环阶的最大可选数量（使用法术位数据）
  const getMaxForLevel = (levelKey: string): number => {
    if (levelKey === "0") return maxCantrips;
    // 使用5E_Classes_Structured.json中的法术位数据
    const slotCount = spellSlotsByLevel[levelKey];
    if (slotCount !== undefined) return slotCount;
    // 对于已知法术职业，使用已知法术上限
    return maxSpells;
  };
  
  if (!className) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">请先在基本信息中选择职业</p>
      </div>
    );
  }
  
  if (!classSpells) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">该职业暂无法术数据</p>
      </div>
    );
  }
  
  if (maxSpellLevel === 0 && maxCantrips === 0) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">该职业在等级 {level} 时无法施法</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 快速建卡推荐 */}
      {quickBuildSpells && level === 1 && (
        <div className="bg-amber-900/20 rounded-lg border border-amber-700/30 p-4">
          <h3 className="text-amber-300 text-sm font-semibold mb-2">快速建卡推荐</h3>
          <p className="text-stone-400 text-xs mb-2">
            根据玩家手册快速建卡指南，以下法术适合你的角色：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickBuildSpells.cantrips.map((spell) => (
              <span key={spell} className="text-xs px-2 py-0.5 rounded bg-amber-800/30 text-amber-200 border border-amber-700/30">
                {spell}（戏法）
              </span>
            ))}
            {quickBuildSpells.level1.map((spell) => (
              <span key={spell} className="text-xs px-2 py-0.5 rounded bg-amber-800/30 text-amber-200 border border-amber-700/30">
                {spell}（1环）
              </span>
            ))}
          </div>
        </div>
      )}
      
      {allExtraSpells.length > 0 && (
        <div className="bg-amber-900/20 rounded-lg border border-amber-700/30 p-4">
          <h3 className="text-amber-300 text-sm font-semibold mb-2">子职额外法术</h3>
          <p className="text-stone-400 text-xs mb-2">
            你的子职提供了以下额外法术（自动获得，不计入已知法术上限）：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allExtraSpells.map((spell) => (
              <span key={spell} className="text-xs px-2 py-0.5 rounded bg-amber-800/30 text-amber-200 border border-amber-700/30">
                {spell}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700/50">
        <p className="text-stone-400 text-xs leading-relaxed">
          {isPreparedCaster 
            ? `你是准备施法职业，可以从法术列表中选择法术进行准备。`
            : `选择你的已知法术（已选 ${Object.values(selectedSpells).flat().length} 个）`
          }
          {maxCantrips > 0 && ` | 戏法上限: ${maxCantrips}`}
          {!isPreparedCaster && maxSpells > 0 && ` | 已知法术上限: ${maxSpells}`}
        </p>
      </div>
      
      {availableLevels.map((levelKey) => {
        const spells = classSpells[levelKey] || [];
        const selected = selectedSpells[levelKey] || [];
        const maxForLevel = getMaxForLevel(levelKey);
        const isMaxed = selected.length >= maxForLevel;
        
        return (
          <div key={levelKey} className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-4">
            <h3 className="text-amber-300 text-sm font-semibold mb-2">
              {levelKey === "0" ? "戏法" : `${levelKey}环法术`}
              <span className="text-stone-500 text-xs ml-2">
                ({selected.length}/{maxForLevel})
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {spells.map((spellName) => {
                const isSelected = selected.includes(spellName);
                const isExtra = allExtraSpells.includes(spellName);
                const isRecommended = quickBuildSpells && 
                  (quickBuildSpells.cantrips.includes(spellName) || quickBuildSpells.level1.includes(spellName));
                return (
                  <button
                    key={spellName}
                    onClick={() => toggleSpell(levelKey, spellName)}
                    disabled={isExtra || (!isSelected && isMaxed)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 text-left ${
                      isExtra
                        ? "bg-amber-800/20 text-amber-400/60 border border-amber-700/20 cursor-not-allowed"
                        : isSelected
                          ? "bg-amber-700/50 text-amber-200 border border-amber-600/50"
                          : isRecommended
                            ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/30 hover:border-emerald-600/50"
                            : "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50"
                    }`}
                    title={isExtra ? "子职自动获得" : isRecommended ? "快速建卡推荐" : ""}
                  >
                    {spellName}
                    {isExtra && <span className="text-[9px] ml-1 opacity-60">(自动)</span>}
                    {isRecommended && !isSelected && <span className="text-[9px] ml-1 opacity-60">(推荐)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}