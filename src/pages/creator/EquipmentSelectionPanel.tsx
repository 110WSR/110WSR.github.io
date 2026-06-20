import { useState, useMemo } from "react";

/** 从5E_Equipment_Structured.json提取的标准武器名称 */
const SIMPLE_MELEE = ["木棍", "匕首", "巨木棍", "手斧", "标枪", "轻锤", "钉头锤", "长棍", "镰刀", "矛"];
const SIMPLE_RANGED = ["轻弩", "飞镖", "短弓", "投石索"];
const MARTIAL_MELEE = ["战斧", "连枷", "宽刃剑", "巨斧", "巨剑", "戟", "骑枪", "长剑", "巨锤", "晨星锤", "长柄枪", "刺剑", "弯刀", "短剑", "三叉戟", "战锤", "军用镐", "鞭"];
const MARTIAL_RANGED = ["吹箭筒", "手弩", "重弩", "长弓", "网"];

const ALL_SIMPLE = [...SIMPLE_MELEE, ...SIMPLE_RANGED];
const ALL_MARTIAL = [...MARTIAL_MELEE, ...MARTIAL_RANGED];
const ALL_WEAPONS = [...ALL_SIMPLE, ...ALL_MARTIAL];

/** 武器类别展开映射 - 将泛型武器类别展开为具体武器列表 */
const WEAPON_EXPANSIONS: Record<string, string[]> = {
  "任意军用近战武器": MARTIAL_MELEE,
  "任意军用武器": ALL_MARTIAL,
  "任意简易武器": ALL_SIMPLE,
  "任意简易近战武器": SIMPLE_MELEE,
  "任意简易武器×2": ALL_SIMPLE,
  "两把军用武器": ALL_MARTIAL,
  "军用武器+盾牌": ALL_MARTIAL,
};

/** 判断一个选项是否需要二次展开 */
function needsExpansion(option: string): boolean {
  return option in WEAPON_EXPANSIONS || option.includes("任意") || option.includes("两把") || option.includes("+");
}

/** 获取展开后的武器列表 */
function getExpandedWeapons(option: string): string[] {
  if (WEAPON_EXPANSIONS[option]) return WEAPON_EXPANSIONS[option];
  if (option.includes("任意")) return ALL_WEAPONS;
  if (option.includes("两把")) return ALL_MARTIAL;
  if (option.includes("+")) return ALL_MARTIAL;
  return [option];
}

/** 解析选项中的数量标记，如"手斧×2"、"标枪×5" */
function parseQuantity(label: string): { name: string; quantity: number } {
  const match = label.match(/^(.+?)×(\d+)$/);
  if (match) {
    return { name: match[1].trim(), quantity: parseInt(match[2]) };
  }
  return { name: label, quantity: 1 };
}

/** 解析复合选项，如"军用武器+盾牌"、"皮甲+长弓+20支箭" */
function parseCompoundOption(option: string): string[] {
  const parts = option.split("+").map(s => s.trim());
  const result: string[] = [];
  for (const part of parts) {
    const { name, quantity } = parseQuantity(part);
    if (quantity > 1) {
      result.push(`${name}×${quantity}`);
    } else {
      result.push(name);
    }
  }
  return result;
}

/** 判断选项是否为复合选项（包含+号） */
function isCompoundOption(option: string): boolean {
  return option.includes("+");
}

/** 判断是否为复数武器选项（如"两把军用武器"、"手斧×2"） */
function isPluralWeaponOption(option: string): boolean {
  return option.includes("两把") || option.includes("×2");
}

/** 获取复数武器需要选择的数量 */
function getPluralCount(option: string): number {
  if (option.includes("两把")) return 2;
  const match = option.match(/×(\d+)/);
  if (match) return parseInt(match[1]);
  return 1;
}

/** 各职业官方起始装备配置 */
const CLASS_EQUIPMENT: Record<string, {
  defaultArmor: string;
  hasShield: boolean;
  mandatoryItems: string[];
  groups: {
    label: string;
    options: string[];
    isWeaponGroup?: boolean;
  }[];
  description: string;
}> = {
  "野蛮人": {
    defaultArmor: "无护甲",
    hasShield: false,
    mandatoryItems: ["探索者套组", "标枪×4"],
    groups: [
      { label: "武器A", options: ["巨斧", "任意军用近战武器"], isWeaponGroup: true },
      { label: "武器B", options: ["手斧×2", "任意简易武器"], isWeaponGroup: true },
    ],
    description: "起始装备：巨斧或任意军用近战武器；两把手斧或任意简易武器；探索者套组和四支标枪",
  },
  "吟游诗人": {
    defaultArmor: "皮甲",
    hasShield: false,
    mandatoryItems: ["匕首"],
    groups: [
      { label: "武器", options: ["刺剑", "长剑", "任意简易武器"], isWeaponGroup: true },
      { label: "套组", options: ["大使套组", "艺人套组"] },
      { label: "乐器", options: ["鲁特琴", "其他乐器"] },
    ],
    description: "起始装备：皮甲；刺剑或长剑或任意简易武器；大使套组或艺人套组；鲁特琴或其他乐器；匕首",
  },
  "牧师": {
    defaultArmor: "",
    hasShield: true,
    mandatoryItems: ["圣徽"],
    groups: [
      { label: "护甲", options: ["鳞甲", "皮甲", "链甲"] },
      { label: "武器", options: ["钉头锤", "战锤"], isWeaponGroup: true },
      { label: "远程武器", options: ["轻弩+20支弩矢", "任意简易武器"], isWeaponGroup: true },
      { label: "套组", options: ["祭司套组", "探索者套组"] },
    ],
    description: "起始装备：鳞甲或皮甲或链甲；钉头锤或战锤；轻弩+20支弩矢或任意简易武器；祭司套组或探索者套组；盾牌和圣徽",
  },
  "德鲁伊": {
    defaultArmor: "皮甲",
    hasShield: true,
    mandatoryItems: ["探索者套组", "德鲁伊法器"],
    groups: [
      { label: "武器A", options: ["木盾", "任意简易武器"], isWeaponGroup: true },
      { label: "武器B", options: ["弯刀", "任意简易近战武器"], isWeaponGroup: true },
    ],
    description: "起始装备：皮甲；木盾或任意简易武器；弯刀或任意简易近战武器；探索者套组和德鲁伊法器",
  },
  "战士": {
    defaultArmor: "",
    hasShield: true,
    mandatoryItems: [],
    groups: [
      { label: "护甲", options: ["链甲", "皮甲+长弓+20支箭"] },
      { label: "武器A", options: ["军用武器+盾牌", "两把军用武器"], isWeaponGroup: true },
      { label: "武器B", options: ["轻弩+20支弩矢", "手斧×2"], isWeaponGroup: true },
      { label: "套组", options: ["地城套组", "探索者套组"] },
    ],
    description: "起始装备：链甲或皮甲+长弓+20支箭；军用武器+盾牌或两把军用武器；轻弩+20支弩矢或两把手斧；地城套组或探索者套组",
  },
  "武僧": {
    defaultArmor: "无护甲",
    hasShield: false,
    mandatoryItems: ["飞镖×10"],
    groups: [
      { label: "武器", options: ["短剑", "任意简易武器"], isWeaponGroup: true },
      { label: "套组", options: ["地城套组", "探索者套组"] },
    ],
    description: "起始装备：短剑或任意简易武器；地城套组或探索者套组；10支飞镖",
  },
  "圣武士": {
    defaultArmor: "链甲",
    hasShield: true,
    mandatoryItems: ["圣徽"],
    groups: [
      { label: "武器A", options: ["军用武器+盾牌", "两把军用武器"], isWeaponGroup: true },
      { label: "武器B", options: ["标枪×5", "任意简易近战武器"], isWeaponGroup: true },
      { label: "套组", options: ["祭司套组", "探索者套组"] },
    ],
    description: "起始装备：链甲；军用武器+盾牌或两把军用武器；五支标枪或任意简易近战武器；祭司套组或探索者套组；圣徽",
  },
  "游侠": {
    defaultArmor: "",
    hasShield: false,
    mandatoryItems: ["长弓", "箭×20"],
    groups: [
      { label: "护甲", options: ["鳞甲", "皮甲"] },
      { label: "武器", options: ["短剑×2", "任意简易武器×2"], isWeaponGroup: true },
      { label: "套组", options: ["地城套组", "探索者套组"] },
    ],
    description: "起始装备：鳞甲或皮甲；两把短剑或任意两把简易武器；地城套组或探索者套组；长弓和20支箭",
  },
  "游荡者": {
    defaultArmor: "皮甲",
    hasShield: false,
    mandatoryItems: ["匕首×2", "盗贼工具"],
    groups: [
      { label: "武器", options: ["刺剑", "短剑"], isWeaponGroup: true },
      { label: "远程武器", options: ["短弓+20支箭", "短剑"], isWeaponGroup: true },
      { label: "套组", options: ["窃贼套组", "地城套组", "探索者套组"] },
    ],
    description: "起始装备：皮甲；刺剑或短剑；短弓+20支箭或短剑；窃贼套组或地城套组或探索者套组；两把匕首和盗贼工具",
  },
  "术士": {
    defaultArmor: "无护甲",
    hasShield: false,
    mandatoryItems: ["匕首×2"],
    groups: [
      { label: "武器", options: ["轻弩+20支弩矢", "任意简易武器"], isWeaponGroup: true },
      { label: "法器", options: ["材料包", "奥术法器"] },
      { label: "套组", options: ["地城套组", "探索者套组"] },
    ],
    description: "起始装备：轻弩+20支弩矢或任意简易武器；材料包或奥术法器；地城套组或探索者套组；两把匕首",
  },
  "邪术师": {
    defaultArmor: "皮甲",
    hasShield: false,
    mandatoryItems: ["匕首×2"],
    groups: [
      { label: "武器", options: ["轻弩+20支弩矢", "任意简易武器"], isWeaponGroup: true },
      { label: "法器", options: ["材料包", "奥术法器"] },
      { label: "套组", options: ["学者套组", "地城套组"] },
    ],
    description: "起始装备：皮甲；轻弩+20支弩矢或任意简易武器；材料包或奥术法器；学者套组或地城套组；任意简易武器和两把匕首",
  },
  "法师": {
    defaultArmor: "无护甲",
    hasShield: false,
    mandatoryItems: ["法术书"],
    groups: [
      { label: "武器", options: ["长棍", "匕首"], isWeaponGroup: true },
      { label: "法器", options: ["材料包", "奥术法器"] },
      { label: "套组", options: ["学者套组", "探索者套组"] },
    ],
    description: "起始装备：长棍或匕首；材料包或奥术法器；学者套组或探索者套组；法术书",
  },
  "奇械师": {
    defaultArmor: "",
    hasShield: true,
    mandatoryItems: ["工匠套组"],
    groups: [
      { label: "护甲", options: ["皮甲", "链甲衫"] },
      { label: "武器", options: ["轻弩", "长剑", "短剑"], isWeaponGroup: true },
    ],
    description: "起始装备：皮甲或链甲衫；轻弩或长剑或短剑；盾牌；工匠套组",
  },
  "血猎手": {
    defaultArmor: "皮甲",
    hasShield: false,
    mandatoryItems: ["地城套组"],
    groups: [
      { label: "武器A", options: ["长剑", "巨剑", "巨斧"], isWeaponGroup: true },
      { label: "武器B", options: ["手弩", "短弓"], isWeaponGroup: true },
    ],
    description: "起始装备：皮甲；长剑或巨剑或巨斧；手弩或短弓；地城套组",
  },
};

export default function EquipmentSelectionPanel({
  selectedWeapons, onWeaponsChange,
  selectedArmor, onArmorChange,
  hasShield, onShieldChange,
  equipmentText, onEquipmentTextChange,
  className: propClassName
}: {
  selectedWeapons: string[];
  onWeaponsChange: (w: string[]) => void;
  selectedArmor: string;
  onArmorChange: (a: string) => void;
  hasShield: boolean;
  onShieldChange: (s: boolean) => void;
  equipmentText: string;
  onEquipmentTextChange: (t: string) => void;
  className?: string;
}) {
  const config = propClassName ? CLASS_EQUIPMENT[propClassName] : null;

  // 每个选项组的选择状态：{ groupIndex: selectedOption }
  const [groupSelections, setGroupSelections] = useState<Record<number, string>>({});
  // 武器二次展开的选择：{ groupIndex: string[] } - 支持多选
  const [weaponSubSelections, setWeaponSubSelections] = useState<Record<number, string[]>>({});

  // 处理选项组选择
  const handleGroupSelect = (groupIndex: number, option: string) => {
    const newSelections = { ...groupSelections };
    
    if (newSelections[groupIndex] === option) {
      delete newSelections[groupIndex];
    } else {
      newSelections[groupIndex] = option;
    }
    
    setGroupSelections(newSelections);
    
    // 如果取消选择或切换选项，清除二次选择
    if (newSelections[groupIndex] !== option) {
      const newSub = { ...weaponSubSelections };
      delete newSub[groupIndex];
      setWeaponSubSelections(newSub);
    }
    
    // 更新武器列表
    updateWeaponsFromSelections(newSelections, weaponSubSelections);
  };

  // 处理武器二次选择（支持多选，复数武器允许选相同武器多次）
  const handleWeaponSubToggle = (groupIndex: number, weapon: string) => {
    const current = weaponSubSelections[groupIndex] || [];
    const newSub = { ...weaponSubSelections };
    const selected = groupSelections[groupIndex];
    const isPlural = selected && isPluralWeaponOption(selected);
    
    if (isPlural) {
      // 复数武器：点击添加一把，再次点击移除一把
      const idx = current.indexOf(weapon);
      if (idx !== -1) {
        // 移除该武器的一个实例
        const newArr = [...current];
        newArr.splice(idx, 1);
        newSub[groupIndex] = newArr;
      } else {
        // 添加该武器的一个实例（允许重复）
        newSub[groupIndex] = [...current, weapon];
      }
    } else {
      // 非复数武器：普通 toggle
      if (current.includes(weapon)) {
        newSub[groupIndex] = current.filter(w => w !== weapon);
      } else {
        newSub[groupIndex] = [...current, weapon];
      }
    }
    
    setWeaponSubSelections(newSub);
    updateWeaponsFromSelections(groupSelections, newSub);
  };

  // 根据所有选择更新武器列表
  const updateWeaponsFromSelections = (
    groups: Record<number, string>,
    subs: Record<number, string[]>
  ) => {
    if (!config) return;
    
    const weapons: string[] = [];
    let shouldHaveShield = false;
    
    for (let i = 0; i < config.groups.length; i++) {
      const group = config.groups[i];
      const selected = groups[i];
      if (!selected) continue;
      
      if (group.isWeaponGroup) {
        if (needsExpansion(selected)) {
          // 展开的武器选项 - 使用二次选择的具体武器列表
          const subWeapons = subs[i] || [];
          weapons.push(...subWeapons);
          
          // 如果选项包含"+盾牌"，自动勾选盾牌
          if (selected.includes("+盾牌")) {
            shouldHaveShield = true;
          }
        } else if (isCompoundOption(selected)) {
          // 复合选项如"轻弩+20支弩矢" - 只取武器部分
          const parts = parseCompoundOption(selected);
          for (const part of parts) {
            if (part !== "盾牌") {
              weapons.push(part);
            }
          }
        } else {
          // 普通武器选项
          const { name, quantity } = parseQuantity(selected);
          if (quantity > 1) {
            weapons.push(`${name}×${quantity}`);
          } else {
            weapons.push(name);
          }
        }
      }
    }
    
    onWeaponsChange(weapons);
    // 如果选择了"军用武器+盾牌"，自动勾选盾牌
    if (shouldHaveShield && !hasShield) {
      onShieldChange(true);
    }
  };

  // 获取护甲选项列表
  const armorOptions = useMemo(() => {
    if (!config) return [];
    const options: string[] = [];
    for (const group of config.groups) {
      if (group.label === "护甲") {
        options.push(...group.options);
      }
    }
    return options;
  }, [config]);

  // 处理护甲选择
  const handleArmorSelect = (armor: string) => {
    onArmorChange(armor);
  };

  // 获取所有已选物品的摘要文本
  const getEquipmentSummary = () => {
    if (!config) return "";
    const parts: string[] = [];
    
    if (selectedArmor) {
      parts.push(`护甲: ${selectedArmor}`);
    } else if (config.defaultArmor && config.defaultArmor !== "无护甲") {
      parts.push(`护甲: ${config.defaultArmor}`);
    }
    
    if (selectedWeapons.length > 0) {
      parts.push(`武器: ${selectedWeapons.join(", ")}`);
    }
    
    if (hasShield) {
      parts.push("盾牌");
    }
    
    if (config.mandatoryItems.length > 0) {
      parts.push(config.mandatoryItems.join(", "));
    }
    
    for (let i = 0; i < config.groups.length; i++) {
      const group = config.groups[i];
      if (group.label === "套组" || group.label === "法器" || group.label === "乐器") {
        const selected = groupSelections[i];
        if (selected) {
          parts.push(selected);
        }
      }
    }
    
    if (equipmentText.trim()) {
      parts.push(equipmentText.trim());
    }
    
    return parts.join("；");
  };

  if (!config) {
    return (
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
        <p className="text-stone-400 text-sm">请先在基本信息中选择职业</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 职业装备提示 */}
      <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700/50">
        <p className="text-stone-400 text-xs leading-relaxed">{config.description}</p>
      </div>

      {/* 默认护甲 */}
      {config.defaultArmor && (
        <div className="bg-emerald-900/20 rounded-lg border border-emerald-700/30 p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-300 text-sm font-medium">默认护甲：{config.defaultArmor}</span>
          </div>
          <p className="text-emerald-200/60 text-xs ml-6 mt-1">该职业默认拥有此护甲</p>
        </div>
      )}

      {/* 顺序选项组 */}
      {config.groups.map((group, groupIndex) => {
        const selected = groupSelections[groupIndex];
        const isWeaponExpanded = group.isWeaponGroup && selected && needsExpansion(selected);
        const expandedWeapons = isWeaponExpanded ? getExpandedWeapons(selected) : [];
        const subSelected = weaponSubSelections[groupIndex] || [];
        const pluralCount = selected && isPluralWeaponOption(selected) ? getPluralCount(selected) : 1;
        const isPlural = selected && isPluralWeaponOption(selected);

        return (
          <div key={groupIndex}>
            <h3 className="text-amber-300 text-sm font-semibold mb-2">
              {group.label}
              {selected && <span className="text-stone-500 text-xs ml-2">(已选: {selected})</span>}
              {isPlural && subSelected.length > 0 && (
                <span className={`text-xs ml-2 ${subSelected.length >= pluralCount ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ({subSelected.length}/{pluralCount})
                </span>
              )}
            </h3>
            
            {/* 选项按钮（单选） */}
            <div className="flex flex-wrap gap-2 mb-2">
              {group.options.map((option) => {
                const isSelected = selected === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleGroupSelect(groupIndex, option)}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
                      isSelected
                        ? "bg-amber-700/50 text-amber-200 border border-amber-600/50"
                        : "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* 武器二次展开选择（支持多选） */}
            {isWeaponExpanded && expandedWeapons.length > 0 && (
              <div className="ml-4 p-3 bg-stone-800/30 rounded-lg border border-stone-700/30">
                <p className="text-stone-500 text-xs mb-2">
                  {isPlural 
                    ? `请选择 ${pluralCount} 把武器（点击选择/取消，已选 ${subSelected.length}/${pluralCount}）`
                    : "请选择具体武器："
                  }
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {expandedWeapons.map((weapon) => {
                    const isSubSelected = subSelected.includes(weapon);
                    return (
                      <button
                        key={weapon}
                        onClick={() => handleWeaponSubToggle(groupIndex, weapon)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 ${
                          isSubSelected
                            ? "bg-amber-700/50 text-amber-200 border border-amber-600/50"
                            : "bg-stone-900/50 text-stone-400 border border-stone-700/30 hover:border-stone-600/50"
                        }`}
                      >
                        {weapon}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 护甲选择 */}
      {armorOptions.length > 0 && (
        <div>
          <h3 className="text-amber-300 text-sm font-semibold mb-2">护甲选择</h3>
          <div className="flex flex-wrap gap-2">
            {armorOptions.map((armor) => {
              const isSelected = selectedArmor === armor;
              return (
                <button
                  key={armor}
                  onClick={() => handleArmorSelect(isSelected ? "" : armor)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
                    isSelected
                      ? "bg-amber-700/50 text-amber-200 border border-amber-600/50"
                      : "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50"
                  }`}
                >
                  {armor}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 盾牌选项 */}
      {config.hasShield && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="shield"
            checked={hasShield}
            onChange={(e) => onShieldChange(e.target.checked)}
            className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-amber-600 focus:ring-amber-600"
          />
          <label htmlFor="shield" className="text-stone-300 text-sm cursor-pointer">装备盾牌</label>
        </div>
      )}

      {/* 必选物品提示 */}
      {config.mandatoryItems.length > 0 && (
        <div className="bg-amber-900/20 rounded-lg border border-amber-700/30 p-3">
          <h3 className="text-amber-300 text-xs font-semibold mb-1">必选物品（自动获得）</h3>
          <div className="flex flex-wrap gap-1.5">
            {config.mandatoryItems.map((item) => (
              <span key={item} className="text-xs px-2 py-0.5 rounded bg-amber-800/30 text-amber-200 border border-amber-700/30">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 装备摘要 */}
      <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-3">
        <h3 className="text-stone-400 text-xs font-semibold mb-1">当前装备摘要</h3>
        <p className="text-stone-500 text-xs">{getEquipmentSummary() || "尚未选择任何装备"}</p>
      </div>

      {/* 其他装备 */}
      <div>
        <h3 className="text-amber-300 text-sm font-semibold mb-3">其他装备/物品</h3>
        <textarea
          value={equipmentText}
          onChange={(e) => onEquipmentTextChange(e.target.value)}
          placeholder="输入其他装备、物品或备注..."
          rows={3}
          className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm resize-none"
        />
      </div>
    </div>
  );
}