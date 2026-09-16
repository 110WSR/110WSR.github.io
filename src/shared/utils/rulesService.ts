// ============================================================================
// 规则服务 - 2024 版规则数据访问与"规则扩充"管理
// 数据来源：data/rules2024.json（由 DND车卡大师 v1.9.93 数据集转换）
// ============================================================================
import rulesData from "../../../data/rules2024.json";

export interface TraitSourceInfo {
  source: string; // 出处，如 "PHB2024·野蛮人"
  text: string;
}

export interface ExpansionInfo {
  id: string;
  name: string;
  nameEn?: string;
  section: "core" | "official" | "thirdparty";
  desc?: string;
}

interface Rules2024 {
  meta: { version: string; source: string; generated: string };
  expansions: ExpansionInfo[];
  core: {
    races: string[];
    raceDetails: Array<{ name: string; traits?: Array<{ name: string; desc?: string }> }>;
    backgrounds: Array<{
      name: string;
      description?: string;
      skills?: string[];
      tool?: string;
      feat?: string;
      abilities?: string[];
    }>;
    classes: string[];
    classDetails: Array<{
      name: string;
      name_en: string;
      hd: number;
      saves: string[];
      armorProfs: string[];
      weaponProfs: string[];
      toolProfs: string[];
      skillOptionsCount: number;
      skillOptionsList: string[];
      primaryAbility: string[];
    }>;
    traits: Record<string, TraitSourceInfo[]>;
    classProgression: Record<string, { levels: Record<string, { features: string[]; featureTexts: Record<string, string> }> }>;
  };
  expansionsData: Record<string, {
    traits: Record<string, TraitSourceInfo[]>;
    raceNames?: string[];
    classNames?: string[];
  }>;
}

const RULES = rulesData as unknown as Rules2024;

// ── 基础规则集：5R(2024 新规) / 5E(2014 经典)，参考 DND车卡大师的“先选规则版本”设计 ──
export type Ruleset = "5r2024" | "5e2014";

const RULESET_KEY = "dnd5e_ruleset_v1";

/** 5E(2014) 经典核心内容：旧版种族与背景（项目原有硬编码数据） */
const CLASSIC_2014 = {
  races: ["人类", "精灵", "矮人", "半身人", "侏儒", "半精灵", "半兽人", "龙裔", "提夫林"],
  backgrounds: ["侍僧", "骗子", "艺人", "平民英雄", "罪犯", "贵族", "贤者", "士兵", "化外之民", "水手", "工匠", "佣兵"],
};

export function getRuleset(): Ruleset {
  try {
    const raw = localStorage.getItem(RULESET_KEY);
    if (raw === "5e2014" || raw === "5r2024") return raw;
  } catch { /* ignore */ }
  return "5r2024";
}

/**
 * 切换基础规则集。参照车卡大师行为：切换会清空已选扩展书，
 * 未保存的角色若包含另一规则集的专属内容需重新选择。
 */
export function setRuleset(rs: Ruleset): void {
  try {
    localStorage.setItem(RULESET_KEY, rs);
    localStorage.setItem(LS_KEY, JSON.stringify([]));
  } catch { /* ignore */ }
  emitChange();
}

/** 血统称呼：2024 规则称“物种”，2014 规则称“种族” */
export function getAncestryLabel(): string {
  return getRuleset() === "5e2014" ? "种族" : "物种";
}

// ── 规则扩充开关（localStorage 持久化，全局生效）──
const LS_KEY = "dnd5e_enabled_expansions_v1";

export function getExpansions(): ExpansionInfo[] {
  return RULES.expansions;
}

export function getEnabledExpansions(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isExpansionEnabled(id: string): boolean {
  return id === "phb2024" || getEnabledExpansions().includes(id);
}

export function setExpansionEnabled(id: string, enabled: boolean): void {
  if (id === "phb2024") return; // 核心规则不可关闭
  const cur = new Set(getEnabledExpansions());
  if (enabled) cur.add(id);
  else cur.delete(id);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...cur]));
  } catch {
    /* ignore */
  }
  emitChange();
}

// ── 订阅（跨组件同步开关状态）──
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeExpansions(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emitChange() {
  traitMapCache = null;
  listeners.forEach((fn) => fn());
}

// ── 建卡选项：种族 / 背景 / 职业（基础规则集 + 已启用扩充）──
export function getRaceOptions(): string[] {
  const base = getRuleset() === "5e2014" ? CLASSIC_2014.races : RULES.core.races;
  const extra = getEnabledExpansions().flatMap(
    (id) => RULES.expansionsData[id]?.raceNames ?? []
  );
  return [...new Set([...base, ...extra])];
}

export function getBackgroundOptions(): string[] {
  if (getRuleset() === "5e2014") return [...CLASSIC_2014.backgrounds];
  return RULES.core.backgrounds.map((b) => b.name);
}

export function getClassOptions(): string[] {
  const extra = getEnabledExpansions().flatMap(
    (id) => RULES.expansionsData[id]?.classNames ?? []
  );
  return [...RULES.core.classes, ...extra];
}

export function getBackgroundDetail(name: string) {
  return RULES.core.backgrounds.find((b) => b.name === name);
}

export function getRaceDetail(name: string) {
  return RULES.core.raceDetails.find((r) => r.name === name);
}

// ── 职业熟练度 / 背景技能 / 物种技能选择（车卡流程用，参照离线版“技能”步骤）──
import armorData from "../../../data/armor.json";
import weaponsData from "../../../data/weapons.json";
import toolsData from "../../../data/tools.json";

const CLASS_NAME_ALIASES: Record<string, string> = {
  邪术师: "魔契师",
  契术师: "魔契师",
  诗人: "吟游诗人",
};

export function getClassDetail(className: string) {
  if (!className) return undefined;
  const normalized = CLASS_NAME_ALIASES[className] ?? className;
  return RULES.core.classDetails.find(
    (c) => c.name === className || c.name === normalized || c.name_en.toLowerCase() === className.toLowerCase()
  );
}

const ARMOR_BY_CATEGORY: Record<string, string[]> = {};
for (const a of armorData as Array<{ name: string; category?: string }>) {
  if (!a.category) continue;
  const cat = a.category.split(" ")[0].trim();
  (ARMOR_BY_CATEGORY[cat] ??= []).push(a.name);
}
const WEAPON_BY_CATEGORY: Record<string, string[]> = {};
for (const w of weaponsData as Array<{ name: string; category?: string }>) {
  if (!w.category) continue;
  const cat = w.category.split(" ")[0].trim().replace(/近战|远程/g, "");
  (WEAPON_BY_CATEGORY[cat] ??= []).push(w.name);
}
const TOOL_IDS: string[] = (toolsData as Array<{ name: string }>).map((t) => t.name);

/** 按中文名前缀匹配工具条目 id（tools.json 的名字带英文后缀，如“书法工具calligrapher's supplies”） */
function matchToolId(name: string): string | null {
  const hit = TOOL_IDS.find((id) => id.startsWith(name));
  return hit ?? null;
}

export interface ClassProficiencyIds {
  armor: string[];
  weapon: string[];
  tool: string[];
}

/**
 * 职业自动熟练项（护甲/武器/工具）。
 * 只展开无附加条件的类别（如“军用武器”）；带条件的（如“军用武器（灵巧或轻型）”）不自动授予，由玩家自行勾选。
 */
export function getClassProficiencyIds(className: string): ClassProficiencyIds {
  const detail = getClassDetail(className);
  if (!detail) return { armor: [], weapon: [], tool: [] };
  const armor: string[] = [];
  const weapon: string[] = [];
  const tool: string[] = [];
  for (const p of detail.armorProfs) {
    if (ARMOR_BY_CATEGORY[p]) armor.push(...ARMOR_BY_CATEGORY[p]);
  }
  for (const p of detail.weaponProfs) {
    if (WEAPON_BY_CATEGORY[p]) weapon.push(...WEAPON_BY_CATEGORY[p]);
  }
  for (const p of detail.toolProfs) {
    const id = matchToolId(p);
    if (id) tool.push(id);
  }
  return { armor: [...new Set(armor)], weapon: [...new Set(weapon)], tool: [...new Set(tool)] };
}

/** 5E(2014) 种族武器训练，自动写入武器熟练 */
const CLASSIC_RACE_WEAPON_PROFS: Record<string, string[]> = {
  精灵: ["长剑", "短剑", "长弓", "短弓"],
  矮人: ["战斧", "手斧", "战锤", "轻锤"],
};

export function getRaceWeaponProfIds(race: string): string[] {
  if (getRuleset() !== "5e2014") return [];
  return CLASSIC_RACE_WEAPON_PROFS[race] ?? [];
}

/** 5E(2014) 经典背景技能表（2014 PHB：背景提供 2 项固定技能） */
const CLASSIC_2014_BG_SKILLS: Record<string, string[]> = {
  侍僧: ["洞悉", "宗教"],
  骗子: ["欺瞒", "巧手"],
  艺人: ["体操", "表演"],
  平民英雄: ["驯兽", "求生"],
  罪犯: ["欺瞒", "巧手"],
  贵族: ["历史", "游说"],
  贤者: ["奥秘", "历史"],
  士兵: ["运动", "威吓"],
  化外之民: ["驯兽", "隐匿"],
  水手: ["运动", "察觉"],
  工匠: ["洞悉", "游说"],
  佣兵: ["运动", "威吓"],
};

/** 背景提供的固定技能（5R 取 2024 数据；5E 取经典表） */
export function getBackgroundSkills(bg: string): string[] {
  if (!bg) return [];
  if (getRuleset() === "5e2014") return CLASSIC_2014_BG_SKILLS[bg] ?? [];
  return RULES.core.backgrounds.find((b) => b.name === bg)?.skills ?? [];
}

/** 背景提供的工具（返回可匹配的工具条目 id） */
export function getBackgroundToolId(bg: string): string | null {
  if (!bg) return null;
  const raw = getRuleset() === "5e2014" ? null : RULES.core.backgrounds.find((b) => b.name === bg)?.tool;
  if (!raw) return null;
  return matchToolId(raw);
}

/** 物种/种族授予的自选技能数量（5R：人类“技能”1项；5E：半精灵“多才多艺”2项） */
export function getSpeciesSkillChoiceCount(race: string): number {
  if (!race) return 0;
  if (getRuleset() === "5e2014") return race === "半精灵" ? 2 : 0;
  return race === "人类" ? 1 : 0;
}

/** 2024 物种特性名列表（5R 模式用；5E 走旧的 2014 映射表） */
export function getSpeciesTraitNames2024(race: string): string[] {
  const detail = getRaceDetail(race);
  return detail?.traits?.map((t) => t.name) ?? [];
}

/** 2024 物种特性（含原文描述，来自 races.json） */
export function getSpeciesTraits2024(race: string): Array<{ name: string; text: string }> {
  const detail = getRaceDetail(race);
  return (detail?.traits ?? []).map((t) => ({ name: t.name, text: t.desc ?? "" }));
}

/**
 * 2024 职业特性（5R 模式）：按等级取真实特性名 + 特性原文。
 * 5E 模式返回空，走旧的 2014 关键词表。
 */
export function getClassProgressionTraits(className: string, level: number): Array<{ name: string; text: string }> {
  if (getRuleset() !== "5r2024" || !className || level < 1) return [];
  const normalized = CLASS_NAME_ALIASES[className] ?? className;
  const prog = RULES.core.classProgression[className] ?? RULES.core.classProgression[normalized];
  if (!prog) return [];
  const result: Array<{ name: string; text: string }> = [];
  for (let lv = 1; lv <= Math.min(level, 20); lv++) {
    const info = prog.levels[String(lv)];
    if (!info) continue;
    for (const name of info.features) {
      if (!result.some((r) => r.name === name)) {
        result.push({ name, text: info.featureTexts[name] ?? "" });
      }
    }
  }
  return result;
}

// ── 特性规则描述查询 ──
let traitMapCache: Map<string, TraitSourceInfo[]> | null = null;

function buildTraitMap(): Map<string, TraitSourceInfo[]> {
  if (traitMapCache) return traitMapCache;
  const map = new Map<string, TraitSourceInfo[]>();
  const add = (db: Record<string, TraitSourceInfo[]>) => {
    for (const [name, infos] of Object.entries(db)) {
      const cur = map.get(name) ?? [];
      for (const info of infos) {
        if (!cur.some((c) => c.text === info.text)) cur.push(info);
      }
      map.set(name, cur);
    }
  };
  add(RULES.core.traits);
  for (const id of getEnabledExpansions()) {
    const exp = RULES.expansionsData[id];
    if (exp?.traits) add(exp.traits);
  }
  traitMapCache = map;
  return map;
}

/** 名称归一化：去掉括注与斜杠别名，便于 "狂暴（3次/日）" 之类匹配 "狂暴" */
function normalizeTraitName(name: string): string {
  return name
    .replace(/[（(].*$/, "")
    .replace(/[／/].*$/, "")
    .replace(/（.*$/, "")
    .trim();
}

/**
 * 查询特性的规则描述（核心 + 已启用扩充）
 * 返回多条时表示同名特性来自不同来源（如不同职业都有"施法"）
 */
export function getTraitRuleInfo(name: string): TraitSourceInfo[] {
  if (!name) return [];
  const map = buildTraitMap();
  return map.get(name) ?? map.get(normalizeTraitName(name)) ?? [];
}
