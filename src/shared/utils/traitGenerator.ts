// ============================================================================
// 特性关键词生成器 - 根据职业、等级、种族自动生成特性
// 5R(2024) 模式：职业特性来自 class_progression（真实特性名+原文），
//              物种特性来自 races.json（真实特性名+原文）
// 5E(2014) 模式：使用旧的 2014 关键词表
// 纯熟练授予不再生成特性条目（熟练度在车卡"技能"步骤选择、自动写入熟练面板）
// ============================================================================

import type { TraitItem } from "../types/types";
import { createDefaultTrait } from "../types/types";
import { getRuleset, getSpeciesTraits2024, getClassProgressionTraits } from "./rulesService";

/**
 * 职业特性关键词映射（基于5e6.txt官方数据）
 * 每个职业在不同等级获得的关键特性
 */
const CLASS_TRAITS: Record<string, Array<{ level: number; name: string }>> = {
  barbarian: [
    { level: 1, name: "狂暴" },
    { level: 1, name: "无甲防御" },
    { level: 2, name: "鲁莽攻击" },
    { level: 2, name: "险境感知" },
    { level: 3, name: "原初道途" },
    { level: 5, name: "额外攻击" },
    { level: 7, name: "直觉闪避" },
    { level: 9, name: "凶蛮重击（1骰）" },
    { level: 11, name: "持久狂暴" },
    { level: 13, name: "凶蛮重击（2骰）" },
    { level: 15, name: "不屈勇武" },
    { level: 17, name: "凶蛮重击（3骰）" },
    { level: 18, name: "不屈勇武" },
    { level: 20, name: "原初斗士" },
  ],
  bard: [
    { level: 1, name: "施法" },
    { level: 1, name: "诗人激励（d6）" },
    { level: 2, name: "万事通" },
    { level: 2, name: "休憩曲（d6）" },
    { level: 3, name: "吟游诗人学院" },
    { level: 3, name: "专精" },
    { level: 5, name: "诗人激励（d8）" },
    { level: 5, name: "激励之源" },
    { level: 6, name: "反制魅惑" },
    { level: 9, name: "休憩曲（d8）" },
    { level: 10, name: "诗人激励（d10）" },
    { level: 10, name: "魔法奥秘" },
    { level: 13, name: "休憩曲（d10）" },
    { level: 14, name: "超群技艺" },
    { level: 15, name: "诗人激励（d12）" },
    { level: 17, name: "休憩曲（d12）" },
    { level: 18, name: "魔法奥秘" },
    { level: 20, name: "超凡魅力" },
  ],
  cleric: [
    { level: 1, name: "施法" },
    { level: 1, name: "神圣领域" },
    { level: 2, name: "引导神力（1/休息）" },
    { level: 3, name: "领域特性" },
    { level: 5, name: "毁灭打击" },
    { level: 6, name: "引导神力（2/休息）" },
    { level: 6, name: "领域特性" },
    { level: 8, name: "毁灭打击" },
    { level: 10, name: "神圣干预" },
    { level: 14, name: "毁灭打击" },
    { level: 17, name: "领域特性" },
    { level: 18, name: "引导神力（3/休息）" },
    { level: 20, name: "神圣干预" },
  ],
  druid: [
    { level: 1, name: "施法" },
    { level: 1, name: "德鲁伊语" },
    { level: 2, name: "自然变身" },
    { level: 2, name: "德鲁伊结社" },
    { level: 4, name: "自然变身强化" },
    { level: 8, name: "自然变身强化" },
    { level: 18, name: "无限变身" },
    { level: 20, name: "大德鲁伊" },
  ],
  fighter: [
    { level: 1, name: "战斗风格" },
    { level: 1, name: "回气" },
    { level: 2, name: "动作如潮（1次）" },
    { level: 3, name: " martial  archetype" },
    { level: 5, name: "额外攻击（1次）" },
    { level: 9, name: "不屈（1次）" },
    { level: 11, name: "额外攻击（2次）" },
    { level: 13, name: "不屈（2次）" },
    { level: 17, name: "动作如潮（2次）" },
    { level: 17, name: "不屈（3次）" },
    { level: 20, name: "额外攻击（3次）" },
  ],
  monk: [
    { level: 1, name: "无甲防御" },
    { level: 1, name: "武艺" },
    { level: 2, name: "气" },
    { level: 2, name: "疾风连击" },
    { level: 3, name: " monastic  tradition" },
    { level: 4, name: "缓落术" },
    { level: 5, name: "额外攻击" },
    { level: 5, name: "震慑拳" },
    { level: 6, name: " ki  empowered  strikes" },
    { level: 7, name: " evasion" },
    { level: 9, name: "无痕步法" },
    { level: 10, name: "心如止水" },
    { level: 13, name: "遁术" },
    { level: 14, name: "金刚魂" },
    { level: 15, name: "不坏之身" },
    { level: 18, name: "空灵体" },
    { level: 20, name: "超凡入圣" },
  ],
  paladin: [
    { level: 1, name: "圣疗" },
    { level: 1, name: "神圣感知" },
    { level: 2, name: "施法" },
    { level: 2, name: "圣光打击" },
    { level: 2, name: "战斗风格" },
    { level: 3, name: "神圣誓言" },
    { level: 3, name: "引导神力" },
    { level: 5, name: "额外攻击" },
    { level: 6, name: "保护光环" },
    { level: 7, name: "誓言特性" },
    { level: 10, name: "勇气光环" },
    { level: 11, name: "神圣打击" },
    { level: 14, name: "净化光环" },
    { level: 18, name: "光环扩展" },
    { level: 20, name: "神圣化身" },
  ],
  ranger: [
    { level: 1, name: "宿敌" },
    { level: 1, name: "自然探索者" },
    { level: 2, name: "战斗风格" },
    { level: 2, name: "施法" },
    { level: 3, name: "游侠 archetype" },
    { level: 3, name: "原始意识" },
    { level: 5, name: "额外攻击" },
    { level: 8, name: "穿林" },
    { level: 10, name: "自然伪装" },
    { level: 14, name: "动物亲和" },
    { level: 18, name: "无踪步" },
    { level: 20, name: "宿敌克星" },
  ],
  rogue: [
    { level: 1, name: "专精" },
    { level: 1, name: "偷袭（1d6）" },
    { level: 1, name: "盗贼黑话" },
    { level: 2, name: "灵巧动作" },
    { level: 3, name: "盗贼 archetype" },
    { level: 5, name: "直觉闪避" },
    { level: 6, name: "专精" },
    { level: 7, name: " evasion" },
    { level: 11, name: "可靠才能" },
    { level: 14, name: "盲感" },
    { level: 15, name: "心智灵活" },
    { level: 18, name: "无踪" },
    { level: 20, name: "幸运一击" },
  ],
  sorcerer: [
    { level: 1, name: "施法" },
    { level: 1, name: "术法起源" },
    { level: 2, name: "术法点" },
    { level: 2, name: "超魔法" },
    { level: 3, name: "超魔法" },
    { level: 6, name: "起源特性" },
    { level: 10, name: "超魔法" },
    { level: 14, name: "起源特性" },
    { level: 17, name: "超魔法" },
    { level: 18, name: "起源特性" },
    { level: 20, name: "术法恢复" },
  ],
  warlock: [
    { level: 1, name: "异界宗主" },
    { level: 1, name: "契约魔法" },
    { level: 2, name: " eldritch  invocations" },
    { level: 3, name: " pact  boon" },
    { level: 5, name: " eldritch  invocations" },
    { level: 7, name: " eldritch  invocations" },
    { level: 9, name: " eldritch  invocations" },
    { level: 11, name: " mystic  arcanum（6环）" },
    { level: 12, name: " eldritch  invocations" },
    { level: 13, name: " mystic  arcanum（7环）" },
    { level: 15, name: " mystic  arcanum（8环）" },
    { level: 17, name: " mystic  arcanum（9环）" },
    { level: 20, name: " eldritch  master" },
  ],
  wizard: [
    { level: 1, name: "施法" },
    { level: 1, name: "法术书" },
    { level: 1, name: "法术恢复" },
    { level: 2, name: "奥术传承" },
    { level: 3, name: "传承特性" },
    { level: 6, name: "传承特性" },
    { level: 10, name: "传承特性" },
    { level: 14, name: "传承特性" },
    { level: 18, name: "法术精通" },
    { level: 20, name: " signature  spells" },
  ],
  artificer: [
    { level: 1, name: "施法" },
    { level: 1, name: "工具熟练" },
    { level: 2, name: " infuse  item" },
    { level: 3, name: " artificer  specialist" },
    { level: 5, name: "工具专精" },
    { level: 6, name: " specialist 特性" },
    { level: 9, name: "工具专精" },
    { level: 10, name: "魔法物品精通" },
    { level: 14, name: "魔法物品 savant" },
    { level: 18, name: "魔法物品 master" },
    { level: 20, name: " soul  of  artifice" },
  ],
  bloodhunter: [
    { level: 1, name: "血魔诅咒" },
    { level: 1, name: "血魔 rite" },
    { level: 2, name: "战斗风格" },
    { level: 3, name: "血魔 order" },
    { level: 5, name: "额外攻击" },
    { level: 6, name: " brand  of  castigation" },
    { level: 7, name: "血魔 order 特性" },
    { level: 11, name: "血魔 order 特性" },
    { level: 15, name: "血魔 order 特性" },
    { level: 18, name: "血魔 order 特性" },
    { level: 20, name: "血魔 curse" },
  ],
};

/**
 * 5E(2014) 种族特性关键词表。
 * 注意：纯熟练授予（自选技能、武器训练）不在此列——
 * 熟练度在车卡"技能"步骤选择、武器熟练自动写入角色卡熟练面板。
 */
const RACE_TRAITS: Record<string, string[]> = {
  "矮人": ["黑暗视觉", "矮人韧性", "石工知识"],
  "精灵": ["黑暗视觉", "精灵血统", "敏锐感官", "出神"],
  "卓尔": ["黑暗视觉", "精灵血统", "敏锐感官", "日光敏感"],
  "半身人": ["半身人幸运", "勇敢", "灵巧"],
  "人类": [],
  "人类(异)": ["专长"],
  "龙裔": ["龙族血统", "吐息武器", "伤害抗性"],
  "侏儒": ["黑暗视觉", "侏儒狡黠"],
  "半精灵": ["黑暗视觉", "精灵血统", "出众魅力"],
  "半兽人": ["黑暗视觉", "凶悍", "不屈", "强力体格"],
  "提夫林": ["黑暗视觉", "地狱抗性", "炼狱遗赠"],
  "阿斯莫": ["黑暗视觉", "天界抗性", "治愈之手", "光明使者"],
};

/**
 * 根据职业和等级生成特性。
 * 5R 模式：来自 class_progression 真实特性名+原文；
 * 5E 模式：旧的 2014 关键词表（无原文，悬停时查规则库）。
 */
export function generateClassTraits(className: string, level: number): TraitItem[] {
  if (!className) return [];
  if (getRuleset() === "5r2024") {
    return getClassProgressionTraits(className, level).map((t) => {
      const trait = createDefaultTrait(t.name);
      trait.description = t.text;
      trait.tags = ["职业"];
      return trait;
    });
  }
  const classId = findClassIdByName(className);
  if (!classId) return [];
  const traits = CLASS_TRAITS[classId];
  if (!traits) return [];
  return traits
    .filter(t => t.level <= level)
    .map((t) => {
      const trait = createDefaultTrait(t.name);
      trait.tags = ["职业"];
      return trait;
    });
}

/**
 * 根据种族/物种生成特性。
 * 5R 模式：来自 races.json 真实特性名+原文；
 * 5E 模式：旧的 2014 关键词表。
 */
export function generateRaceTraits(race: string): TraitItem[] {
  if (!race) return [];
  if (getRuleset() === "5r2024") {
    const traits2024 = getSpeciesTraits2024(race);
    if (traits2024.length > 0) {
      return traits2024.map((t) => {
        const trait = createDefaultTrait(t.name);
        trait.description = t.text;
        trait.tags = ["种族"];
        return trait;
      });
    }
  }
  // 5E：精确匹配
  if (RACE_TRAITS[race]) {
    return RACE_TRAITS[race].map((name) => {
      const trait = createDefaultTrait(name);
      trait.tags = ["种族"];
      return trait;
    });
  }
  // 部分匹配
  for (const [key, traits] of Object.entries(RACE_TRAITS)) {
    if (race.includes(key) || key.includes(race)) {
      return traits.map((name) => {
        const trait = createDefaultTrait(name);
        trait.tags = ["种族"];
        return trait;
      });
    }
  }
  return [];
}

/**
 * 生成完整的特性列表（TraitItem[]）。
 * 背景不再生成特性条目（背景的技能/工具已在车卡"技能"步骤处理）。
 */
export function generateTraits(
  className: string,
  level: number,
  race: string,
  _background: string
): TraitItem[] {
  return [
    ...generateClassTraits(className, level),
    ...generateRaceTraits(race),
  ];
}

/**
 * 根据中文职业名查找 classId
 */
function findClassIdByName(className: string): string {
  if (!className) return "";
  const classIdentifiers = [
    { id: "barbarian", labels: ["野蛮人", "barbarian"] },
    { id: "bard", labels: ["吟游诗人", "诗人", "bard"] },
    { id: "cleric", labels: ["牧师", "cleric"] },
    { id: "druid", labels: ["德鲁伊", "druid"] },
    { id: "fighter", labels: ["战士", "fighter"] },
    { id: "monk", labels: ["武僧", "monk"] },
    { id: "paladin", labels: ["圣武士", "paladin"] },
    { id: "ranger", labels: ["游侠", "ranger"] },
    { id: "rogue", labels: ["游荡者", "rogue"] },
    { id: "sorcerer", labels: ["术士", "sorcerer"] },
    { id: "warlock", labels: ["邪术师", "warlock"] },
    { id: "wizard", labels: ["法师", "wizard"] },
    { id: "artificer", labels: ["奇械师", "artificer"] },
    { id: "bloodhunter", labels: ["血猎者", "bloodhunter"] },
  ];
  const entry = classIdentifiers.find(c =>
    c.labels.some(l => l === className)
  );
  return entry?.id ?? "";
}