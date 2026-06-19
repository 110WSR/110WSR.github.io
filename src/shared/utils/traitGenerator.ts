// ============================================================================
// 特性关键词生成器 - 根据职业、等级、种族自动生成特性关键词
// 基于5e玩家手册（5e6.txt职业章节、5e7.txt种族章节）
// ============================================================================

import type { TraitItem } from "../types/types";
import { createDefaultTrait } from "../types/types";

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
 * 种族特性关键词（基于5e7.txt官方数据）
 */
const RACE_TRAITS: Record<string, string[]> = {
  "矮人": ["黑暗视觉", "矮人韧性", "矮人战斗训练", "石工知识"],
  "矮人(丘陵)": ["黑暗视觉", "矮人韧性", "矮人战斗训练", "石工知识", "矮人坚韧"],
  "矮人(山)": ["黑暗视觉", "矮人韧性", "矮人战斗训练", "石工知识", "矮人护甲训练"],
  "精灵": ["黑暗视觉", "精灵血统", "敏锐感官", "精灵武器训练"],
  "精灵(高)": ["黑暗视觉", "精灵血统", "敏锐感官", "精灵武器训练", "额外戏法"],
  "精灵(木)": ["黑暗视觉", "精灵血统", "敏锐感官", "精灵武器训练", "轻灵"],
  "精灵(海)": ["黑暗视觉", "精灵血统", "敏锐感官", "精灵武器训练", "游泳速度"],
  "卓尔": ["黑暗视觉", "精灵血统", "敏锐感官", "卓尔武器训练", "日光敏感"],
  "半身人": ["半身人幸运", "勇敢", "灵巧"],
  "半身人(轻足)": ["半身人幸运", "勇敢", "灵巧", "天生隐匿"],
  "半身人(强心)": ["半身人幸运", "勇敢", "灵巧", "抗毒"],
  "人类": ["额外技能"],
  "人类(异)": ["额外技能", "专长"],
  "龙裔": ["龙族血统", "吐息武器", "伤害抗性"],
  "龙裔(黑)": ["龙族血统", "吐息武器(酸)", "伤害抗性(酸)"],
  "龙裔(蓝)": ["龙族血统", "吐息武器(闪电)", "伤害抗性(闪电)"],
  "龙裔(黄铜)": ["龙族血统", "吐息武器(火)", "伤害抗性(火)"],
  "龙裔(青铜)": ["龙族血统", "吐息武器(闪电)", "伤害抗性(闪电)"],
  "龙裔(铜)": ["龙族血统", "吐息武器(酸)", "伤害抗性(酸)"],
  "龙裔(金)": ["龙族血统", "吐息武器(火)", "伤害抗性(火)"],
  "龙裔(绿)": ["龙族血统", "吐息武器(毒)", "伤害抗性(毒)"],
  "龙裔(红)": ["龙族血统", "吐息武器(火)", "伤害抗性(火)"],
  "龙裔(银)": ["龙族血统", "吐息武器(冷)", "伤害抗性(冷)"],
  "龙裔(白)": ["龙族血统", "吐息武器(冷)", "伤害抗性(冷)"],
  "侏儒": ["黑暗视觉", "侏儒狡黠"],
  "侏儒(森林)": ["黑暗视觉", "侏儒狡黠", "自然亲和", "小把戏"],
  "侏儒(岩石)": ["黑暗视觉", "侏儒狡黠", "工匠直觉", "钟表知识"],
  "半精灵": ["黑暗视觉", "精灵血统", "多才多艺"],
  "半兽人": ["黑暗视觉", "凶悍", "不屈", "强力体格"],
  "提夫林": ["黑暗视觉", "地狱抗性", "炼狱遗赠"],
  "阿斯莫": ["黑暗视觉", " celestial  resistance", " healing  hands", "光明使者"],
};

/**
 * 背景特性关键词（基于5e玩家手册）
 */
const BACKGROUND_TRAITS: Record<string, string[]> = {
  "侍僧": ["信仰服务", "宗教知识"],
  "骗子": ["伪造身份", "犯罪网络"],
  "艺人": ["表演", "受欢迎"],
  "民间英雄": ["乡野传说", "农民支持"],
  "赌徒": ["赌运", "街头情报"],
  "公会工匠": ["公会身份", "工匠网络"],
  "贵族": ["贵族身份", "特权"],
  "骑士": ["骑士身份", "领地"],
  "化外之民": ["野外生存", "自然向导"],
  "学者": ["学术研究", "图书馆"],
  "水手": ["航海经验", "水上导航"],
  "士兵": ["军衔", "军事经验"],
  "流浪儿": ["城市秘密", "街头智慧"],
  "智者": ["智慧箴言", "知识传承"],
  "罪犯": ["犯罪伙伴", "黑市联系"],
  "英雄": ["英雄事迹", "声望"],
  "传教士": ["信仰传播", "信徒网络"],
  "探险家": ["探险经验", "地图绘制"],
  "商人": ["商业嗅觉", "贸易网络"],
  "工匠": ["手艺精湛", "工匠行会"],
};

/**
 * 根据职业和等级生成特性关键词
 */
export function generateClassTraits(className: string, level: number): string[] {
  if (!className) return [];
  const classId = findClassIdByName(className);
  if (!classId) return [];
  const traits = CLASS_TRAITS[classId];
  if (!traits) return [];
  return traits
    .filter(t => t.level <= level)
    .map(t => t.name);
}

/**
 * 根据种族生成特性关键词
 */
export function generateRaceTraits(race: string): string[] {
  if (!race) return [];
  // 尝试精确匹配
  if (RACE_TRAITS[race]) return RACE_TRAITS[race];
  // 尝试部分匹配
  for (const [key, traits] of Object.entries(RACE_TRAITS)) {
    if (race.includes(key) || key.includes(race)) {
      return traits;
    }
  }
  return [];
}

/**
 * 根据背景生成特性关键词
 */
export function generateBackgroundTraits(background: string): string[] {
  if (!background) return [];
  if (BACKGROUND_TRAITS[background]) return BACKGROUND_TRAITS[background];
  for (const [key, traits] of Object.entries(BACKGROUND_TRAITS)) {
    if (background.includes(key) || key.includes(background)) {
      return traits;
    }
  }
  return [];
}

/**
 * 生成完整的特性列表（TraitItem[]）
 */
export function generateTraits(
  className: string,
  level: number,
  race: string,
  background: string
): TraitItem[] {
  const traits: TraitItem[] = [];

  // 职业特性
  const classTraits = generateClassTraits(className, level);
  for (const name of classTraits) {
    const trait = createDefaultTrait(name);
    trait.tags = ["职业"];
    traits.push(trait);
  }

  // 种族特性
  const raceTraits = generateRaceTraits(race);
  for (const name of raceTraits) {
    const trait = createDefaultTrait(name);
    trait.tags = ["种族"];
    traits.push(trait);
  }

  // 背景特性
  const bgTraits = generateBackgroundTraits(background);
  for (const name of bgTraits) {
    const trait = createDefaultTrait(name);
    trait.tags = ["背景"];
    traits.push(trait);
  }

  return traits;
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