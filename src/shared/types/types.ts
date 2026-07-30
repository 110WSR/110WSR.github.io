// ============================================================================
// Finalized type definitions for the new data model
// ============================================================================

// ─── 职业数据（data/classData.json，按职业 id 索引）─────────────────────────
export interface ClassDataEntry {
  /** [生命骰面数, 每级固定成长值] */
  hitpoints: number[];
  /** 预设法术位表（非施法职业为 null） */
  spellSlots: { level: number; slots: number[] }[] | null;
}

// ─── 武器预设（data/weaponPresets.json）─────────────────────────────────────
export interface WeaponPreset {
  label: string;
  damageDice: string;
  damageType: string;
  attackAttr: "str" | "dex";
  tags: string[];
}

// ─── 职业等级数据（data/5E_Classes_Structured.json，按职业中文名索引）─────────
export interface ClassLevelEntry {
  "等级": number;
  "熟练加值"?: string;
  "职业特性"?: string;
  "已知戏法"?: number | null;
  "已知法术"?: number | null;
  "1环"?: number | null;
  "2环"?: number | null;
  "3环"?: number | null;
  "4环"?: number | null;
  "5环"?: number | null;
  "6环"?: number | null;
  "7环"?: number | null;
  "8环"?: number | null;
  "9环"?: number | null;
}

// ─── 特性（物品/武器的特性描述）─────────────────────────────────────────────
export interface Feature {
  id: string;
  name: string;
  description?: string; // 描述
  note?: string;        // 速记字段，如 "3/3"、"1/日"
}

// ─── 额外加值 ─────────────────────────────────────────────────────────────
export interface ExtraBonus {
  id: string;
  value: string; // 如 "+1", "-2", "3"
  source?: string; // 来源说明，用户自定义
}

// ─── 额外伤害 ─────────────────────────────────────────────────────────────
export interface ExtraDamage {
  id: string;
  dice: string;
  type: string;
}

// ─── 物品（装备列表中的条目，也可能是武器）─────────────────────────────────
export interface Item {
  id: string;
  name: string;
  description?: string;
  quantity: number;        // ×n，默认 1
  features: Feature[];

  // 武器标记
  isWeapon: boolean;

  // 以下字段在 isWeapon=true 时有效
  damageDice?: string;        // 如 "1d8"
  damageType?: string;        // 如 "挥砍"
  attackAttr?: "str" | "dex" | "con" | "int" | "wis" | "cha" | "custom";
  attackBonus?: string;       // 自定义攻击加值
  isMagic?: boolean;
  proficient?: boolean;
  extraAttackBonus?: string;
  tags?: string[];            // 武器标签（如 "轻型"、"灵巧"）
  extraDamages?: ExtraDamage[];
}

// ─── 法术 ─────────────────────────────────────────────────────────────────
export interface SpellData {
  id: string;
  name: string;
  description: string;

  isInnate: boolean;          // 天生施法
  usage?: string;             // 天生施法时显示，如 "3/3"
  innateAbility?: "int" | "wis" | "cha"; // 天生施法时覆盖施法属性

  // 法术学派
  school?: string;            // 学派 id: abjuration/conjuration/divination/enchantment/evocation/illusion/necromancy/transmutation
  ritual?: boolean;           // 仪式
  concentration?: boolean;    // 专注
  prepared?: boolean;         // 已准备

  // 用于攻击栏计算
  damageDice?: string;
  damageType?: string;
  attackBonus?: number;       // 法术攻击加值
  saveType?: "attack" | "save"; // 命中类/豁免类 伤害法术标记
  /** 预计算后的攻击栏显示值，如 "+5" 或 "DC15" */
  attackDisplay?: string;
}

// ─── 攻击栏条目 ───────────────────────────────────────────────────────────
export interface AttackEntry {
  id: string;
  type: "weapon" | "spell";
  refId: string; // 指向 Item.id 或 SpellData.id
}

// ─── 特质条目（特性与特质）────────────────────────────────────────────────
export interface TraitItem {
  id: string;
  name: string;
  usage?: string;        // 使用次数，如 "3/3"
  description?: string;
  tags?: string[];       // 自定义标签
}

export function createDefaultTrait(name = ""): TraitItem {
  return {
    id: `trait_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    tags: [],
  };
}

// ─── 默认值 ───────────────────────────────────────────────────────────────
export function createDefaultItem(name = ""): Item {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    quantity: 1,
    features: [],
    isWeapon: false,
  };
}

export function createDefaultSpell(): SpellData {
  return {
    id: `spell_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    description: "",
    isInnate: false,
  };
}

export function createDefaultAttackEntry(type: "weapon" | "spell", refId: string): AttackEntry {
  return {
    id: `attack_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    refId,
  };
}
