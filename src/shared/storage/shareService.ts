// ============================================================================
// 5eShare 分享格式 - 精简 JSON 格式，用于快速在不同端导入/导出角色卡
// ============================================================================

import type { CharacterData, Attributes } from "./types";

/**
 * 5eShare 格式版本
 */
const SHARE_VERSION = 1;

/**
 * 分享格式接口
 */
export interface ShareData {
  v: number;
  name: string;
  class: string;
  level: number;
  race: string;
  bg: string;
  attrs: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  hp: {
    cur: number;
    max: number;
  };
  skills: string[];
  items: Array<{
    name: string;
    quantity?: number;
    isWeapon?: boolean;
    damageDice?: string;
    damageType?: string;
    attackAttr?: string;
    proficient?: boolean;
    tags?: string[];
    description?: string;
  }>;
  traits: string[];
  spells: string[];
  /** 扩展字段 - 可选，用于保留更多数据 */
  alignment?: string;
  backstory?: string;
  personality?: {
    个性特点?: string;
    理想?: string;
    牵绊?: string;
    缺点?: string;
  };
  coins?: {
    cp?: string;
    sp?: string;
    ep?: string;
    gp?: string;
    pp?: string;
  };
  inventory?: string;
  armor?: string;
  hasShield?: boolean;
  proficiencies?: {
    armor?: string[];
    weapon?: string[];
    tool?: string[];
    language?: string[];
  };
  savingThrows?: string[];
  spellcastingAbility?: string;
}

/**
 * 将角色数据导出为分享格式
 */
export function toShareJSON(character: CharacterData): string {
  const attrs = character.attributes;
  const data: ShareData = {
    v: SHARE_VERSION,
    name: character.name || "",
    class: character.basicInfo?.["职业"] || "",
    level: typeof character.level === "number" ? character.level : 1,
    race: character.basicInfo?.["种族"] || "",
    bg: character.basicInfo?.["背景"] || "",
    attrs: {
      str: attrs.str_value ?? 10,
      dex: attrs.dex_value ?? 10,
      con: attrs.con_value ?? 10,
      int: attrs.int_value ?? 10,
      wis: attrs.wis_value ?? 10,
      cha: attrs.cha_value ?? 10,
    },
    hp: {
      cur: character.currentHP ?? 0,
      max: character.customMaxHP ?? 0,
    },
    skills: Object.entries(character.skills ?? {})
      .filter(([, v]) => v >= 1)
      .map(([k]) => k),
    items: (character.items ?? []).map(i => ({
      name: i.name,
      quantity: i.quantity > 1 ? i.quantity : undefined,
      isWeapon: i.isWeapon || undefined,
      damageDice: i.damageDice || undefined,
      damageType: i.damageType || undefined,
      attackAttr: i.attackAttr || undefined,
      proficient: i.proficient || undefined,
      tags: i.tags?.length ? i.tags : undefined,
      description: i.description || undefined,
    })),
    traits: (character.traitList ?? []).map(t => t.name),
    spells: (character.spellBoxes ?? [])
      .flatMap(b => (b.spells ?? []).filter(s => s.name).map(s => s.name)),
    // 可选扩展字段
    alignment: character.basicInfo?.["阵营"] || undefined,
    backstory: character.backstory || undefined,
    personality: character.personality ? {
      个性特点: character.personality.个性特点 || undefined,
      理想: character.personality.理想 || undefined,
      牵绊: character.personality.牵绊 || undefined,
      缺点: character.personality.缺点 || undefined,
    } : undefined,
    coins: character.coins ? {
      cp: character.coins.cp || undefined,
      sp: character.coins.sp || undefined,
      ep: character.coins.ep || undefined,
      gp: character.coins.gp || undefined,
      pp: character.coins.pp || undefined,
    } : undefined,
    inventory: character.inventory || undefined,
    armor: character.selectedArmorId || undefined,
    hasShield: character.hasShield || undefined,
    proficiencies: character.proficiencies ? {
      armor: character.proficiencies.armor?.length ? character.proficiencies.armor : undefined,
      weapon: character.proficiencies.weapon?.length ? character.proficiencies.weapon : undefined,
      tool: character.proficiencies.tool?.length ? character.proficiencies.tool : undefined,
      language: character.proficiencies.language?.length ? character.proficiencies.language : undefined,
    } : undefined,
    savingThrows: character.savingThrows
      ? Object.entries(character.savingThrows)
          .filter(([, v]) => v)
          .map(([k]) => k)
      : undefined,
    spellcastingAbility: character.spellcastingAbility || undefined,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * 从分享格式解析为部分角色数据
 * 返回可合并到 CharacterData 的部分数据
 */
export function fromShareJSON(json: string): Partial<CharacterData> | null {
  try {
    const data: ShareData = JSON.parse(json);
    if (!data || data.v !== SHARE_VERSION) {
      console.warn("不支持的分享格式版本:", data?.v);
      return null;
    }

    const attrs: Attributes = {
      str_value: data.attrs.str ?? 10,
      dex_value: data.attrs.dex ?? 10,
      con_value: data.attrs.con ?? 10,
      int_value: data.attrs.int ?? 10,
      wis_value: data.attrs.wis ?? 10,
      cha_value: data.attrs.cha ?? 10,
    };

    // 构建技能记录
    const skills: Record<string, 0 | 1 | 2> = {};
    for (const skill of data.skills ?? []) {
      skills[skill] = 1;
    }

    // 构建物品列表（兼容旧格式 string[] 和新格式 object[]）
    const rawItems = data.items ?? [];
    const items = rawItems.map((entry: any) => {
      const name = typeof entry === "string" ? entry : entry.name;
      return {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        quantity: typeof entry === "object" && entry.quantity ? entry.quantity : 1,
        features: [],
        isWeapon: typeof entry === "object" && entry.isWeapon ? true : false,
        ...(typeof entry === "object" ? {
          damageDice: entry.damageDice || undefined,
          damageType: entry.damageType || undefined,
          attackAttr: entry.attackAttr || undefined,
          proficient: entry.proficient || undefined,
          tags: entry.tags || undefined,
          description: entry.description || undefined,
        } : {}),
      };
    });

    // 构建特性列表
    const traitList = (data.traits ?? []).map(name => ({
      id: `trait_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      tags: [] as string[],
    }));

    // 构建豁免
    const savingThrows: Record<string, boolean> = {};
    for (const key of data.savingThrows ?? []) {
      savingThrows[key] = true;
    }

    return {
      name: data.name,
      attributes: attrs,
      level: data.level,
      basicInfo: {
        职业: data.class || "",
        种族: data.race || "",
        背景: data.bg || "",
        阵营: data.alignment || "",
        玩家名: "",
        经验值: "",
      },
      currentHP: data.hp.cur,
      customMaxHP: data.hp.max,
      skills,
      items,
      traitList,
      backstory: data.backstory || "",
      personality: data.personality ? {
        个性特点: data.personality.个性特点 || "",
        理想: data.personality.理想 || "",
        牵绊: data.personality.牵绊 || "",
        缺点: data.personality.缺点 || "",
      } : { 个性特点: "", 理想: "", 牵绊: "", 缺点: "" },
      coins: data.coins ? {
        cp: data.coins.cp || "",
        sp: data.coins.sp || "",
        ep: data.coins.ep || "",
        gp: data.coins.gp || "",
        pp: data.coins.pp || "",
      } : { cp: "", sp: "", ep: "", gp: "", pp: "" },
      inventory: data.inventory || "",
      selectedArmorId: data.armor || null,
      hasShield: data.hasShield || false,
      proficiencies: data.proficiencies ? {
        armor: data.proficiencies.armor ?? [],
        weapon: data.proficiencies.weapon ?? [],
        tool: data.proficiencies.tool ?? [],
        language: data.proficiencies.language ?? [],
      } : { armor: [], weapon: [], tool: [], language: [] },
      savingThrows: savingThrows as any,
      spellcastingAbility: (data.spellcastingAbility as any) || "int",
    };
  } catch (e) {
    console.error("解析分享格式失败:", e);
    return null;
  }
}

/**
 * 检测字符串是否为有效的分享格式
 */
export function isShareFormat(json: string): boolean {
  try {
    const data = JSON.parse(json);
    return data && data.v === SHARE_VERSION && data.attrs && data.name !== undefined;
  } catch {
    return false;
  }
}