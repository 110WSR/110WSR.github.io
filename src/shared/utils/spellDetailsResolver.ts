import type { SpellData } from "../types/types";
import spellDetails from "../../../data/spellDetails.json";

// 法术详细信息类型
export interface SpellDetail {
  "名称（中）": string;
  "名称（英）": string;
  "环阶与学派": string;
  "施法时间": string;
  "施法距离": string;
  "法术成分": string;
  "持续时间": string;
  "描述": string;
}

// 学派映射
const SCHOOL_MAP: Record<string, string> = {
  "防护": "abjuration",
  "咒法": "conjuration",
  "预言": "divination",
  "附魔": "enchantment",
  "塑能": "evocation",
  "幻术": "illusion",
  "死灵": "necromancy",
  "变化": "transmutation",
};

// 反向映射
const SCHOOL_LABEL_MAP: Record<string, string> = {
  abjuration: "防护",
  conjuration: "咒法",
  divination: "预言",
  enchantment: "附魔",
  evocation: "塑能",
  illusion: "幻术",
  necromancy: "死灵",
  transmutation: "变化",
};

/**
 * 从法术名称获取法术详细信息
 */
export function getSpellDetailByName(name: string): SpellDetail | undefined {
  const details = spellDetails as SpellDetail[];
  return details.find(s => s["名称（中）"] === name);
}

/**
 * 解析环阶与学派字符串，返回 { level, school, ritual, concentration }
 * 例如："一环 塑能" -> { level: 1, school: "evocation", ritual: false }
 * "防护戏法" -> { level: 0, school: "abjuration", ritual: false }
 * "一环 防护（仪式）" -> { level: 1, school: "abjuration", ritual: true }
 */
export function parseLevelAndSchool(levelSchoolStr: string): {
  level: number;
  school: string;
  ritual: boolean;
  concentration: boolean;
} {
  let level = 0;
  let school = "abjuration";
  let ritual = false;
  let concentration = false;

  // 判断环阶
  if (levelSchoolStr.includes("戏法")) {
    level = 0;
  } else {
    const match = levelSchoolStr.match(/(\d+)环/);
    if (match) {
      level = parseInt(match[1]);
    }
  }

  // 判断仪式
  if (levelSchoolStr.includes("仪式")) {
    ritual = true;
  }

  // 判断学派
  for (const [label, id] of Object.entries(SCHOOL_MAP)) {
    if (levelSchoolStr.includes(label)) {
      school = id;
      break;
    }
  }

  // 判断专注（从描述中判断）
  if (levelSchoolStr.includes("专注")) {
    concentration = true;
  }

  return { level, school, ritual, concentration };
}

/**
 * 从描述中判断是否包含"专注"
 */
export function checkConcentration(description: string): boolean {
  return description.includes("专注");
}

/**
 * 从法术详细信息创建 SpellData 对象
 */
export function createSpellDataFromDetail(detail: SpellDetail): SpellData {
  const { level, school, ritual } = parseLevelAndSchool(detail["环阶与学派"]);
  const concentration = checkConcentration(detail["描述"]);

  // 构建描述文本（包含施法时间、施法距离、法术成分、持续时间等元信息）
  const fullDescription = `施法时间：${detail["施法时间"]}\n施法距离：${detail["施法距离"]}\n法术成分：${detail["法术成分"]}\n持续时间：${detail["持续时间"]}\n\n${detail["描述"]}`;

  return {
    id: `spell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: detail["名称（中）"],
    description: fullDescription,
    isInnate: false,
    school,
    ritual,
    concentration,
    prepared: level > 0,
  };
}

/**
 * 根据法术名称创建 SpellData（从数据库中查找）
 */
export function createSpellDataByName(name: string): SpellData | null {
  const detail = getSpellDetailByName(name);
  if (!detail) return null;
  return createSpellDataFromDetail(detail);
}

export { SCHOOL_LABEL_MAP };