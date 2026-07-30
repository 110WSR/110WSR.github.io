// ============================================================================
// 导入服务 - 支持从多种格式导入角色数据
// ============================================================================

import type { CharacterData, Attributes, SavingThrows, SavingThrowKey } from "./types";
import type { Item, TraitItem } from "../types/types";
import { fromShareJSON, isShareFormat } from "./shareService";

// ─── 外部导入 JSON 的最小结构描述（仅声明解析时用到的字段）────────────────────

/** 枭熊（Owlbear Rodeo）格式 */
interface OwlbearImport {
  abilities?: Record<string, { total?: number; save?: { proficient?: boolean } }>;
  identity?: {
    character_name?: string;
    player?: string;
    race?: { name?: string };
    alignment?: string;
  };
  core_stats?: { hp?: { current?: number; max?: number } };
  classes?: { name?: string; level?: number }[];
  background?: {
    background_name?: string;
    story?: string;
    personality?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
  };
  skills?: { name?: string; proficiency?: string }[];
  combat?: {
    weapons?: { name?: string; damage?: string; damage_type?: string; proficient?: boolean }[];
    armor?: { name?: string };
    shield?: { equipped?: boolean };
  };
  features?: {
    class_features?: { name?: string }[];
    race_features?: { name?: string }[];
    feats?: { name?: string }[];
  };
  inventory?: { currency?: { wallet?: { gp?: number } } };
  total_level?: number;
}

/** Foundry VTT 格式 */
interface FVTTImport {
  name?: string;
  system?: {
    abilities?: Record<string, { value?: number; proficient?: number | boolean }>;
    details?: {
      level?: number;
      class?: string;
      race?: string;
      background?: string;
      alignment?: string;
      xp?: { value?: number | string };
      biography?: { value?: string };
      trait?: string;
      ideal?: string;
      bond?: string;
      flaw?: string;
    };
    attributes?: { hp?: { value?: number; max?: number } };
    skills?: Record<string, { value?: number }>;
  };
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  data?: Partial<CharacterData>;
  error?: string;
  format: string;
}

/**
 * 检测导入格式并解析
 */
export function importCharacter(json: string): ImportResult {
  // 1. 尝试分享格式
  if (isShareFormat(json)) {
    const data = fromShareJSON(json);
    if (data) {
      return { success: true, data, format: "5eShare" };
    }
    return { success: false, error: "分享格式解析失败", format: "5eShare" };
  }

  // 2. 尝试枭熊格式 (Owlbear Rodeo)
  try {
    const parsed = JSON.parse(json);
    if (parsed.schema_version && parsed.identity && parsed.abilities) {
      const data = fromOwlbearJSON(parsed);
      if (data) {
        return { success: true, data, format: "Owlbear" };
      }
    }
  } catch { /* 不是枭熊格式 */ }

  // 3. 尝试 FVTT 格式
  try {
    const parsed = JSON.parse(json);
    if (parsed.type === "character" && parsed.system?.abilities) {
      const data = fromFVTTJSON(parsed);
      if (data) {
        return { success: true, data, format: "FVTT" };
      }
    }
  } catch { /* 不是 FVTT 格式 */ }

  return { success: false, error: "无法识别的格式", format: "unknown" };
}

/**
 * 从枭熊格式解析
 */
function fromOwlbearJSON(parsed: OwlbearImport): Partial<CharacterData> | null {
  try {
    const abilities = parsed.abilities || {};
    const identity = parsed.identity || {};
    const coreStats = parsed.core_stats || {};
    const classes = parsed.classes || [];
    const mainClass = classes[0] || {};
    const background = parsed.background || {};

    // 属性
    const attrMap: Record<string, keyof Attributes> = { str: "str_value", dex: "dex_value", con: "con_value", int: "int_value", wis: "wis_value", cha: "cha_value" };
    const attrs: Partial<Attributes> = {};
    for (const [k, v] of Object.entries(abilities)) {
      const targetKey = attrMap[k];
      if (targetKey && typeof v === "object" && v !== null) {
        attrs[targetKey] = v.total ?? 10;
      }
    }

    // 技能
    const skills: Record<string, 0 | 1 | 2> = {};
    if (Array.isArray(parsed.skills)) {
      for (const skill of parsed.skills) {
        if (skill.name && skill.proficiency === "proficient") {
          skills[skill.name] = 1;
        } else if (skill.name && skill.proficiency === "expertise") {
          skills[skill.name] = 2;
        }
      }
    }

    // 物品
    const combat = parsed.combat || {};
    const items: Item[] = [];
    if (Array.isArray(combat.weapons)) {
      for (const w of combat.weapons) {
        if (w.name) {
          items.push({
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: w.name,
            quantity: 1,
            features: [],
            isWeapon: true,
            damageDice: w.damage ? w.damage.split("+")[0]?.trim() : undefined,
            damageType: w.damage_type || undefined,
            proficient: w.proficient,
          });
        }
      }
    }
    if (combat.armor?.name) {
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: combat.armor.name,
        quantity: 1,
        features: [],
        isWeapon: false,
      });
    }

    // 特性
    const features = parsed.features || {};
    const traitList: TraitItem[] = [];
    for (const f of [...(features.class_features || []), ...(features.race_features || []), ...(features.feats || [])]) {
      if (f.name) {
        traitList.push({
          id: `trait_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          tags: [],
        });
      }
    }

    // 豁免
    const savingThrows: Partial<SavingThrows> = {};
    const saveMap: Record<string, string> = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha" };
    for (const [k, v] of Object.entries(abilities)) {
      if (typeof v === "object" && v !== null) {
        const save = v.save;
        if (save?.proficient) {
          const saveKey = Object.entries(saveMap).find(([, val]) => val === k)?.[0] as SavingThrowKey | undefined;
          if (saveKey) savingThrows[saveKey] = true;
        }
      }
    }

    return {
      name: identity.character_name || "",
      attributes: attrs as Attributes,
      level: parsed.total_level ?? mainClass.level ?? 1,
      basicInfo: {
        职业: mainClass.name || "",
        种族: identity.race?.name || "",
        背景: background.background_name || "",
        阵营: identity.alignment || "",
        玩家名: identity.player || "",
        经验值: "",
      },
      currentHP: coreStats.hp?.current ?? 0,
      customMaxHP: coreStats.hp?.max ?? 0,
      skills,
      items,
      traitList,
      backstory: background.story || "",
      personality: {
        个性特点: background.personality || "",
        理想: background.ideals || "",
        牵绊: background.bonds || "",
        缺点: background.flaws || "",
      },
      inventory: parsed.inventory?.currency?.wallet
        ? `金币: ${parsed.inventory.currency.wallet.gp || 0}`
        : "",
      hasShield: combat.shield?.equipped || false,
      savingThrows: savingThrows as SavingThrows,
    };
  } catch (e) {
    console.error("枭熊格式解析失败:", e);
    return null;
  }
}

/**
 * 从 FVTT 格式解析
 */
function fromFVTTJSON(parsed: FVTTImport): Partial<CharacterData> | null {
  try {
    const system = parsed.system || {};
    const abilities = system.abilities || {};
    const details = system.details || {};
    const attributes = system.attributes || {};

    // 属性
    const attrMap: Record<string, keyof Attributes> = { str: "str_value", dex: "dex_value", con: "con_value", int: "int_value", wis: "wis_value", cha: "cha_value" };
    const attrs: Partial<Attributes> = {};
    for (const [k, v] of Object.entries(abilities)) {
      const targetKey = attrMap[k];
      if (targetKey && typeof v === "object" && v !== null) {
        attrs[targetKey] = v.value ?? 10;
      }
    }

    // 技能
    const skills: Record<string, 0 | 1 | 2> = {};
    const skillReverseMap: Record<string, string> = {
      ath: "运动", acr: "特技", slt: "巧手", ste: "隐匿",
      inv: "调查", arc: "奥秘", his: "历史", nat: "自然", rel: "宗教",
      prc: "察觉", ins: "洞悉", ani: "驯兽", med: "医药", sur: "求生",
      per: "游说", dec: "欺瞒", itm: "威吓", prf: "表演",
    };
    const sysSkills = system.skills || {};
    for (const [key, val] of Object.entries(sysSkills)) {
      const cnName = skillReverseMap[key];
      if (cnName && typeof val === "object" && val !== null) {
        const state = val.value ?? 0;
        if (state >= 1) skills[cnName] = state as 0 | 1 | 2;
      }
    }

    // 豁免
    const savingThrows: Partial<SavingThrows> = {};
    const saveKeys = ["str", "dex", "con", "int", "wis", "cha"];
    const saveNameMap: Record<string, SavingThrowKey> = { str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" };
    for (const k of saveKeys) {
      const abil = abilities[k];
      if (abil && abil.proficient) {
        savingThrows[saveNameMap[k]] = true;
      }
    }

    return {
      name: parsed.name || "",
      attributes: attrs as Attributes,
      level: details.level || 1,
      basicInfo: {
        职业: details.class || "",
        种族: details.race || "",
        背景: details.background || "",
        阵营: details.alignment || "",
        玩家名: "",
        经验值: String(details.xp?.value ?? ""),
      },
      currentHP: attributes.hp?.value ?? 0,
      customMaxHP: attributes.hp?.max ?? 0,
      skills,
      savingThrows: savingThrows as SavingThrows,
      backstory: details.biography?.value || "",
      personality: {
        个性特点: details.trait || "",
        理想: details.ideal || "",
        牵绊: details.bond || "",
        缺点: details.flaw || "",
      },
    };
  } catch (e) {
    console.error("FVTT 格式解析失败:", e);
    return null;
  }
}