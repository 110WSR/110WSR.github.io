import type { Attributes } from "../../shared/storage/types";

export type AttributeMethod = "standard" | "random" | "recommended" | "manual";

export const RECOMMENDED_BUILDS: { label: string; attrs: Attributes }[] = [
  { label: "战士/圣武士（力量型）", attrs: { str_value: 15, dex_value: 13, con_value: 14, int_value: 10, wis_value: 12, cha_value: 8 } },
  { label: "游侠/武僧（敏捷型）", attrs: { str_value: 10, dex_value: 15, con_value: 14, int_value: 12, wis_value: 13, cha_value: 8 } },
  { label: "法师/术士（施法型）", attrs: { str_value: 8, dex_value: 14, con_value: 13, int_value: 15, wis_value: 12, cha_value: 10 } },
  { label: "牧师/德鲁伊（感知型）", attrs: { str_value: 12, dex_value: 10, con_value: 14, int_value: 8, wis_value: 15, cha_value: 13 } },
  { label: "游荡者/诗人（魅力型）", attrs: { str_value: 8, dex_value: 15, con_value: 13, int_value: 12, wis_value: 10, cha_value: 14 } },
  { label: "邪术师（魅力战斗型）", attrs: { str_value: 10, dex_value: 14, con_value: 13, int_value: 8, wis_value: 12, cha_value: 15 } },
];

export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUY_TOTAL = 27;

export const ATTRIBUTE_FIELDS: { key: keyof Attributes; label: string; abbr: string }[] = [
  { key: "str_value", label: "力量", abbr: "STR" },
  { key: "dex_value", label: "敏捷", abbr: "DEX" },
  { key: "con_value", label: "体质", abbr: "CON" },
  { key: "int_value", label: "智力", abbr: "INT" },
  { key: "wis_value", label: "感知", abbr: "WIS" },
  { key: "cha_value", label: "魅力", abbr: "CHA" },
];

export const CLASS_OPTIONS = ["战士", "圣武士", "游侠", "武僧", "游荡者", "法师", "术士", "邪术师", "牧师", "德鲁伊", "诗人", "野蛮人", "契术师"];
export const RACE_OPTIONS = ["人类", "精灵", "矮人", "半身人", "侏儒", "半精灵", "半兽人", "龙裔", "提夫林"];
export const BACKGROUND_OPTIONS = ["侍僧", "骗子", "艺人", "平民英雄", "罪犯", "贵族", "贤者", "士兵", "化外之民", "水手", "工匠", "佣兵"];
export const ALIGNMENT_OPTIONS = ["守序善良", "中立善良", "混乱善良", "守序中立", "绝对中立", "混乱中立", "守序邪恶", "中立邪恶", "混乱邪恶", "无阵营"];

export const WEAPON_CATEGORIES = [
  { label: "简易近战武器", options: ["短棒", "匕首", "巨棒", "手斧", "标枪", "轻锤", "硬头锤", "长棍", "镰刀", "矛"] },
  { label: "简易远程武器", options: ["轻弩", "飞镖", "短弓", "投石索"] },
  { label: "军用近战武器", options: ["战斧", "链枷", "长柄刀", "巨斧", "巨剑", "戟", "骑枪", "长剑", "巨锤", "钉头锤", "长矛", "刺剑", "弯刀", "短剑", "三叉戟", "战镐", "战锤", "鞭"] },
  { label: "军用远程武器", options: ["吹箭筒", "手弩", "重弩", "长弓", "捕网"] },
];

export const ARMOR_OPTIONS = [
  { label: "无护甲", value: "" }, { label: "轻甲（皮甲）", value: "皮甲" }, { label: "轻甲（镶钉皮甲）", value: "镶钉皮甲" },
  { label: "中甲（鳞甲）", value: "鳞甲" }, { label: "中甲（链甲衫）", value: "链甲衫" }, { label: "中甲（半身板甲）", value: "半身板甲" },
  { label: "重甲（锁子甲）", value: "锁子甲" }, { label: "重甲（板条甲）", value: "板条甲" }, { label: "重甲（全身板甲）", value: "全身板甲" },
];

/** 种族属性加成数据（基于5e PHB标准规则） */
export const RACE_ABILITY_BONUSES: Record<string, { label: string; bonuses: Partial<Attributes>; description: string }> = {
  "人类": {
    label: "人类",
    bonuses: { str_value: 1, dex_value: 1, con_value: 1, int_value: 1, wis_value: 1, cha_value: 1 },
    description: "所有属性值各+1"
  },
  "精灵": {
    label: "精灵",
    bonuses: { dex_value: 2 },
    description: "敏捷+2"
  },
  "矮人": {
    label: "矮人",
    bonuses: { con_value: 2 },
    description: "体质+2"
  },
  "半身人": {
    label: "半身人",
    bonuses: { dex_value: 2 },
    description: "敏捷+2"
  },
  "侏儒": {
    label: "侏儒",
    bonuses: { int_value: 2 },
    description: "智力+2"
  },
  "半精灵": {
    label: "半精灵",
    bonuses: { cha_value: 2 },
    description: "魅力+2，自选两项各+1"
  },
  "半兽人": {
    label: "半兽人",
    bonuses: { str_value: 2, con_value: 1 },
    description: "力量+2，体质+1"
  },
  "龙裔": {
    label: "龙裔",
    bonuses: { str_value: 2, cha_value: 1 },
    description: "力量+2，魅力+1"
  },
  "提夫林": {
    label: "提夫林",
    bonuses: { cha_value: 2, int_value: 1 },
    description: "魅力+2，智力+1"
  },
};

/** 精灵亚种属性加成 */
export const SUBRACE_ABILITY_BONUSES: Record<string, { label: string; bonuses: Partial<Attributes>; description: string }> = {
  "高等精灵": { label: "高等精灵", bonuses: { int_value: 1 }, description: "智力+1" },
  "木精灵": { label: "木精灵", bonuses: { wis_value: 1 }, description: "感知+1" },
  "黑暗精灵(卓尔)": { label: "黑暗精灵(卓尔)", bonuses: { cha_value: 1 }, description: "魅力+1" },
  "丘陵矮人": { label: "丘陵矮人", bonuses: { wis_value: 1 }, description: "感知+1" },
  "山地矮人": { label: "山地矮人", bonuses: { str_value: 2 }, description: "力量+2" },
  "轻足半身人": { label: "轻足半身人", bonuses: { cha_value: 1 }, description: "魅力+1" },
  "敦实半身人": { label: "敦实半身人", bonuses: { con_value: 1 }, description: "体质+1" },
  "森林侏儒": { label: "森林侏儒", bonuses: { dex_value: 1 }, description: "敏捷+1" },
  "岩石侏儒": { label: "岩石侏儒", bonuses: { con_value: 1 }, description: "体质+1" },
};

/** 职业推荐主属性（用于在属性页面提示玩家） */
export const CLASS_PRIMARY_ATTRIBUTES: Record<string, { primary: string; secondary: string; description: string }> = {
  "野蛮人": { primary: "力量", secondary: "体质", description: "主属性：力量（近战攻击），次属性：体质（狂暴维持）" },
  "战士": { primary: "力量或敏捷", secondary: "体质", description: "主属性：力量（近战）或敏捷（远程），次属性：体质" },
  "圣武士": { primary: "力量", secondary: "魅力", description: "主属性：力量（近战攻击），次属性：魅力（法术DC）" },
  "游侠": { primary: "敏捷", secondary: "感知", description: "主属性：敏捷（远程攻击），次属性：感知（法术）" },
  "武僧": { primary: "敏捷", secondary: "感知", description: "主属性：敏捷（攻击），次属性：感知（AC和DC）" },
  "游荡者": { primary: "敏捷", secondary: "智力", description: "主属性：敏捷（偷袭），次属性：智力（技能）" },
  "法师": { primary: "智力", secondary: "敏捷", description: "主属性：智力（法术DC），次属性：敏捷（AC）" },
  "术士": { primary: "魅力", secondary: "体质", description: "主属性：魅力（法术DC），次属性：体质（专注）" },
  "邪术师": { primary: "魅力", secondary: "体质", description: "主属性：魅力（法术DC），次属性：体质（专注）" },
  "牧师": { primary: "感知", secondary: "力量或敏捷", description: "主属性：感知（法术DC），次属性：力量或敏捷（攻击）" },
  "德鲁伊": { primary: "感知", secondary: "敏捷", description: "主属性：感知（法术DC），次属性：敏捷（AC）" },
  "诗人": { primary: "魅力", secondary: "敏捷", description: "主属性：魅力（法术DC），次属性：敏捷（AC）" },
  "契术师": { primary: "魅力", secondary: "体质", description: "主属性：魅力（法术DC），次属性：体质（专注）" },
};

export function roll4d6DropLowest(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

export function generateRandomAttributes(): Attributes {
  const values = Array.from({ length: 6 }, () => roll4d6DropLowest());
  values.sort((a, b) => b - a);
  return { str_value: values[0], dex_value: values[1], con_value: values[2], int_value: values[3], wis_value: values[4], cha_value: values[5] };
}

export function calcMod(val: number): string {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? "+" + mod : "" + mod;
}