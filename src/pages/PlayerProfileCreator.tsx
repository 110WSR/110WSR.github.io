import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCharacter } from "../shared/storage/CharacterContext";
import type { Attributes } from "../shared/storage/types";
import type { Item, AttackEntry } from "../shared/types/types";
import { createDefaultItem } from "../shared/types/types";
import weaponPresets from "../../data/weaponPresets.json";

// ============================================================================
// 玩家画像式建卡 - 基于 DND_2024_Knowledge_Base.json 的智能推荐
// ============================================================================

/** 知识库中的构筑条目 */
interface BuildEntry {
  ID: number;
  "规则层级": string;
  "推荐名称": string;
  "难度标签": string;
  "经验标签": string;
  "性格标签": string;
  "目标标签": string;
  "队伍槽位": string;
  "操作复杂度": string;
  "Source Mode": string;
  Species: string;
  Class: string;
  Subclass: string;
  Background: string;
  "Origin Feat": string;
  "推荐属性": string;
  "核心玩法循环": string;
  "优点": string;
  "风险/踩坑": string;
  "DM备注/兼容性": string;
  AvoidTags: string;
  "匹配得分": number;
}

/** 问卷输入 */
interface Questionnaire {
  difficulty: string;
  experience: string;
  complexity: string;
  personality: string;
  goal: string;
  teamGap: string;
  ruleSource: string;
  allowFaerun: string;
  dislike: string;
  style: string;
}

const DIFFICULTY_OPTIONS = [
  { value: "D0", label: "D0 - 休闲剧情/RP优先" },
  { value: "D1", label: "D1 - 标准冒险" },
  { value: "D2", label: "D2 - 挑战冒险" },
  { value: "D3", label: "D3 - 高危硬核" },
  { value: "D4", label: "D4 - 优化老手局" },
];

const EXPERIENCE_OPTIONS = [
  { value: "N0", label: "N0 - 纯新手" },
  { value: "N1", label: "N1 - 入门" },
  { value: "N2", label: "N2 - 熟练" },
  { value: "N3", label: "N3 - 优化老手" },
];

const COMPLEXITY_OPTIONS = [
  { value: "Low", label: "Low - 简单（少资源管理）" },
  { value: "Medium", label: "Medium - 中等" },
  { value: "High", label: "High - 复杂（愿读法术/机制）" },
];

const PERSONALITY_OPTIONS = [
  "冲锋型", "保护型", "策略型", "社交型", "探索型", "叙事型", "优化型", "混沌型", "支援型",
];

const GOAL_OPTIONS = [
  "生存", "输出", "简单上手", "控场", "治疗/辅助", "全能", "探索", "社交",
];

const TEAM_GAP_OPTIONS = [
  "Frontline", "Healing", "Control", "AoE Damage", "Single-target Damage",
  "Exploration/Scout", "Social Face", "Utility",
];

const RULE_SOURCE_OPTIONS = [
  { value: "2024 Core Only", label: "2024 Core Only（最干净）" },
  { value: "2024 + 2024 Expansions", label: "2024 + 费伦新扩展" },
  { value: "Legacy", label: "Legacy（需DM审核）" },
];

const DISLIKE_OPTIONS = [
  { value: "None", label: "无" },
  { value: "No Spell Management", label: "不想管法术" },
  { value: "Avoid Melee", label: "不想近战" },
  { value: "Avoid Fragile Casters", label: "不想玩脆皮" },
  { value: "Avoid Complex Resources", label: "不想复杂资源管理" },
];

// 职业中文名映射
const CLASS_NAME_MAP: Record<string, string> = {
  "Fighter": "战士", "Barbarian": "野蛮人", "Paladin": "圣武士",
  "Ranger": "游侠", "Rogue": "游荡者", "Monk": "武僧",
  "Bard": "吟游诗人", "Cleric": "牧师", "Druid": "德鲁伊",
  "Sorcerer": "术士", "Warlock": "邪术师", "Wizard": "法师",
};

// 种族中文名映射
const RACE_NAME_MAP: Record<string, string> = {
  "Human": "人类", "Elf": "精灵", "Dwarf": "矮人",
  "Halfling": "半身人", "Gnome": "侏儒", "Dragonborn": "龙裔",
  "Half-Elf": "半精灵", "Half-Orc": "半兽人", "Tiefling": "魔裔",
  "Aasimar": "神裔", "Goliath": "歌利亚", "Orc": "兽人",
};

// 背景中文名映射
const BACKGROUND_MAP: Record<string, string> = {
  "Soldier": "士兵", "Guard": "护卫", "Farmer": "农夫",
  "Acolyte": "侍僧", "Guide": "向导", "Wayfarer": "旅人",
  "Criminal": "罪犯", "Charlatan": "骗子", "Entertainer": "艺人",
  "Sage": "贤者", "Scribe": "抄写员", "Hermit": "隐士",
  "Artisan": "工匠", "Noble": "贵族",
};

// 子职中文名映射
const SUBCLASS_MAP: Record<string, string> = {
  "Champion": "冠军勇士", "Battle Master": "战斗大师", "Eldritch Knight": "奥法骑士",
  "Path of the Berserker": "狂战士之道", "Path of the Wild Heart": "野性之心之道",
  "Oath of Devotion": "奉献誓言", "Oath of Vengeance": "复仇誓言", "Oath of Glory": "荣耀誓言",
  "Gloom Stalker": "幽域追踪者", "Hunter": "猎人",
  "Thief": "盗贼", "Assassin": "刺客", "Soulknife": "魂刃",
  "College of Lore": "学识学院", "College of Valor": "勇气学院",
  "Life Domain": "生命领域", "Light Domain": "光明领域", "War Domain": "战争领域",
  "Circle of the Moon": "月亮结社", "Circle of the Stars": "星辰结社", "Circle of the Land": "大地结社",
  "Warrior of Shadow": "暗影武者", "Warrior of Mercy": "慈悲武者", "Warrior of the Open Hand": "空手武者",
  "Draconic Sorcery": "龙脉术法", "Wild Magic Sorcery": "狂野术法",
  "Fiend Patron": "邪魔宗主", "Archfey Patron": "妖精宗主",
  "Diviner": "预言法师", "Abjurer": "防护法师",
  "Bladesinger": "剑咏者", "Banneret": "旗手", "Knowledge Domain": "知识领域",
  "Spellfire Sorcery": "Spellfire术法", "Oath of the Noble Genies": "贵族精灵誓言",
  "Winter Walker": "冬境行者", "Scion of the Three": "三者之裔",
  "Tempest Domain": "风暴领域", "School of Necromancy": "死灵学派",
  "College of Eloquence": "雄辩学院", "Purple Dragon Knight / Banneret (legacy name)": "紫龙骑士",
};

/** 解析推荐属性字符串为 Attributes */
function parseAttributes(attrStr: string): Attributes {
  const result: Attributes = {
    str_value: 10, dex_value: 10, con_value: 10,
    int_value: 10, wis_value: 10, cha_value: 10,
  };
  if (!attrStr) return result;

  const parts = attrStr.split(";").map(s => s.trim());
  for (const part of parts) {
    const match = part.match(/(STR|DEX|CON|INT|WIS|CHA)\s*>\s*(.+)/);
    if (match) {
      const primary = match[1];
      const secondary = match[2].split(">").map(s => s.trim());
      const attrKey = (primary.toLowerCase() + "_value") as keyof Attributes;
      result[attrKey] = 15;
      if (secondary.length > 0) {
        const secKey = (secondary[0].toLowerCase() + "_value") as keyof Attributes;
        if (secKey in result) result[secKey] = 14;
      }
      if (secondary.length > 1) {
        const thirdKey = (secondary[1].toLowerCase() + "_value") as keyof Attributes;
        if (thirdKey in result) result[thirdKey] = 13;
      }
    }
  }
  return result;
}

/** 根据职业获取默认武器 */
function getDefaultWeapons(className: string): string[] {
  const weaponMap: Record<string, string[]> = {
    "Fighter": ["长剑", "长弓"], "Barbarian": ["巨斧"], "Paladin": ["长剑", "盾牌"],
    "Ranger": ["短剑", "长弓"], "Rogue": ["匕首", "短剑"], "Monk": ["短棍"],
    "Bard": ["细剑"], "Cleric": ["钉头锤", "盾牌"], "Druid": ["木棍"],
    "Sorcerer": ["匕首"], "Warlock": ["匕首"], "Wizard": ["匕首"],
  };
  return weaponMap[className] || ["匕首"];
}

/** 根据职业获取默认护甲 */
function getDefaultArmor(className: string): string {
  const armorMap: Record<string, string> = {
    "Fighter": "链甲", "Barbarian": "无甲", "Paladin": "链甲",
    "Ranger": "皮甲", "Rogue": "皮甲", "Monk": "无甲",
    "Bard": "皮甲", "Cleric": "链甲", "Druid": "皮甲",
    "Sorcerer": "无甲", "Warlock": "皮甲", "Wizard": "无甲",
  };
  return armorMap[className] || "无甲";
}

export default function PlayerProfileCreator() {
  const navigate = useNavigate();
  const { newCharacter, setAttributes, setBasicInfo, setLevel, updateCharacter } = useCharacter();

  const [step, setStep] = useState<"questionnaire" | "results" | "detail">("questionnaire");

  const [questionnaire, setQuestionnaire] = useState<Questionnaire>({
    difficulty: "D1",
    experience: "N1",
    complexity: "Low",
    personality: "冲锋型",
    goal: "输出",
    teamGap: "Frontline",
    ruleSource: "2024 Core Only",
    allowFaerun: "No",
    dislike: "None",
    style: "",
  });

  const [results, setResults] = useState<BuildEntry[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<BuildEntry | null>(null);
  const [builds, setBuilds] = useState<BuildEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载知识库数据
  useEffect(() => {
    fetch("/DND_2024_Knowledge_Base.json")
      .then(r => r.json())
      .then(data => {
        setBuilds(data.builds || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // 匹配算法
  const handleSearch = useCallback(() => {
    if (builds.length === 0) return;

    const scored = builds.map(build => {
      let score = 0;

      if (build["难度标签"].includes(questionnaire.difficulty)) score += 20;
      if (build["经验标签"].includes(questionnaire.experience)) score += 15;
      if (build["性格标签"].includes(questionnaire.personality)) score += 15;
      if (build["目标标签"].includes(questionnaire.goal)) score += 15;
      if (build["队伍槽位"].includes(questionnaire.teamGap)) score += 15;

      if (build["操作复杂度"] === questionnaire.complexity) score += 10;
      else if (questionnaire.complexity === "Low" && build["操作复杂度"] === "Medium") score += 5;
      else if (questionnaire.complexity === "High" && build["操作复杂度"] === "Medium") score += 8;

      if (questionnaire.ruleSource === "2024 Core Only" && build["Source Mode"] !== "2024 PHB") score -= 40;
      if (questionnaire.ruleSource === "2024 + 2024 Expansions" && build["Source Mode"].includes("Legacy")) score -= 50;
      if (questionnaire.allowFaerun === "No" && build["Source Mode"].includes("Faerûn")) score -= 25;
      if (questionnaire.dislike !== "None" && build.AvoidTags?.includes(questionnaire.dislike)) score -= 25;

      return { ...build, "匹配得分": score };
    });

    scored.sort((a, b) => b["匹配得分"] - a["匹配得分"]);
    setResults(scored.slice(0, 10));
    setStep("results");
  }, [builds, questionnaire]);

  const handleSelectBuild = useCallback((build: BuildEntry) => {
    setSelectedBuild(build);
    setStep("detail");
  }, []);

  const handleConfirmCreate = useCallback(() => {
    if (!selectedBuild) return;

    const className = CLASS_NAME_MAP[selectedBuild.Class] || selectedBuild.Class;
    const raceName = RACE_NAME_MAP[selectedBuild.Species] || selectedBuild.Species;
    const backgroundName = BACKGROUND_MAP[selectedBuild.Background] || selectedBuild.Background;

    newCharacter(selectedBuild["推荐名称"]);

    const attrs = parseAttributes(selectedBuild["推荐属性"]);
    setAttributes(attrs);

    setBasicInfo({
      职业: className,
      职业_id: selectedBuild.Class.toLowerCase(),
      种族: raceName,
      背景: backgroundName,
      阵营: "守序善良",
      玩家名: "",
      经验值: "",
    });

    setLevel(1);

    const weapons = getDefaultWeapons(selectedBuild.Class);
    const armor = getDefaultArmor(selectedBuild.Class);
    const newItems: Item[] = [];
    const newAttackEntries: AttackEntry[] = [];

    const weaponPresetList = weaponPresets as any[];
    for (const weaponName of weapons) {
      const preset = weaponPresetList.find((w: any) => w.label === weaponName);
      if (preset) {
        const item = createDefaultItem(preset.label);
        item.isWeapon = true;
        item.damageDice = preset.damageDice;
        item.damageType = preset.damageType;
        item.attackAttr = preset.attackAttr;
        item.tags = preset.tags;
        item.proficient = true;
        newItems.push(item);
        newAttackEntries.push({
          id: `weapon_${item.id}`,
          type: "weapon",
          refId: item.id,
        });
      } else {
        const item = createDefaultItem(weaponName);
        item.isWeapon = true;
        item.proficient = true;
        newItems.push(item);
        newAttackEntries.push({
          id: `weapon_${item.id}`,
          type: "weapon",
          refId: item.id,
        });
      }
    }

    if (armor && armor !== "无甲") {
      const armorItem = createDefaultItem(armor);
      newItems.push(armorItem);
    }

    updateCharacter({
      items: newItems,
      attackEntries: newAttackEntries,
      equipment: `武器: ${weapons.join(", ")}\n护甲: ${armor}`,
      traitList: [
        {
          id: `build_${Date.now()}`,
          name: `推荐构筑：${selectedBuild["推荐名称"]}`,
          description: selectedBuild["核心玩法循环"],
          tags: ["构筑"],
        },
      ],
    });

    navigate("/sheet");
  }, [selectedBuild, newCharacter, setAttributes, setBasicInfo, setLevel, updateCharacter, navigate]);

  const updateQuestionnaire = (key: keyof Questionnaire, value: string) => {
    setQuestionnaire(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
        <div className="text-amber-300 text-lg">加载知识库中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
      {/* 顶部导航 */}
      <div className="border-b border-stone-700/50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => step === "questionnaire" ? navigate("/") : setStep("questionnaire")}
            className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {step === "questionnaire" ? "返回" : "重新选择"}
          </button>
          <div className="text-stone-500 text-xs sm:text-sm">
            {step === "questionnaire" ? "玩家画像式建卡" : step === "results" ? "推荐方案" : "方案详情"}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["questionnaire", "results", "detail"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step === s ? "bg-amber-700 text-amber-50" : "bg-stone-700 text-stone-400"
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs ${step === s ? "text-amber-300" : "text-stone-500"}`}>
                {s === "questionnaire" ? "填写问卷" : s === "results" ? "选择方案" : "确认创建"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-stone-700" />}
            </div>
          ))}
        </div>

        {/* 问卷页面 */}
        {step === "questionnaire" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-6">玩家画像问卷</h2>
            <p className="text-stone-400 text-sm mb-6">
              请根据你的偏好填写以下信息，系统将自动匹配最适合你的角色构筑方案。
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">剧本难度</label>
                <select
                  value={questionnaire.difficulty}
                  onChange={e => updateQuestionnaire("difficulty", e.target.value)}
                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">玩家经验</label>
                <select
                  value={questionnaire.experience}
                  onChange={e => updateQuestionnaire("experience", e.target.value)}
                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">操作复杂度偏好</label>
                <select
                  value={questionnaire.complexity}
                  onChange={e => updateQuestionnaire("complexity", e.target.value)}
                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  {COMPLEXITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">主要性格</label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => updateQuestionnaire("personality", p)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        questionnaire.personality === p
                          ? "bg-amber-700 text-amber-50 border border-amber-500"
                          : "bg-stone-700 text-stone-300 border border-stone-600 hover:border-stone-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">游戏目标</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => updateQuestionnaire("goal", g)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        questionnaire.goal === g
                          ? "bg-amber-700 text-amber-50 border border-amber-500"
                          : "bg-stone-700 text-stone-300 border border-stone-600 hover:border-stone-500"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">队伍最缺的位置</label>
                <select
                  value={questionnaire.teamGap}
                  onChange={e => updateQuestionnaire("teamGap", e.target.value)}
                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  {TEAM_GAP_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">规则来源</label>
                <select
                  value={questionnaire.ruleSource}
                  onChange={e => updateQuestionnaire("ruleSource", e.target.value)}
                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  {RULE_SOURCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 text-sm font-medium mb-2">不喜欢的机制</label>
                <select
                  value={questionnaire.dislike}
                  onChange={e => updateQuestionnaire("dislike", e.target.value)}
                  className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  {DISLIKE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="w-full mt-8 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg transition-colors font-semibold text-sm"
            >
              开始匹配推荐方案
            </button>
          </div>
        )}

        {/* 推荐结果页面 */}
        {step === "results" && (
          <div className="space-y-4">
            <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
              <h2 className="text-amber-300 text-lg font-semibold mb-2">推荐方案</h2>
              <p className="text-stone-400 text-sm mb-4">
                根据你的画像，以下是匹配度最高的方案（点击查看详情并创建角色）
              </p>

              {results.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-400">没有找到匹配的方案，请调整问卷选项后重试。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((build, index) => (
                    <button
                      key={build.ID}
                      onClick={() => handleSelectBuild(build)}
                      className="w-full text-left p-4 rounded-lg bg-stone-700/30 hover:bg-stone-700/50 border border-stone-600/50 hover:border-amber-600/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-amber-400 text-xs font-mono">#{index + 1}</span>
                            <h3 className="text-stone-200 font-medium text-sm group-hover:text-amber-300 transition-colors truncate">
                              {build["推荐名称"]}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px]">
                              {RACE_NAME_MAP[build.Species] || build.Species}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px]">
                              {CLASS_NAME_MAP[build.Class] || build.Class}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px]">
                              {SUBCLASS_MAP[build.Subclass] || build.Subclass}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px]">
                              {BACKGROUND_MAP[build.Background] || build.Background}
                            </span>
                          </div>
                          <p className="text-stone-500 text-[10px] mt-2 line-clamp-2">
                            {build["核心玩法循环"]}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-amber-400 text-lg font-bold">{build["匹配得分"]}</div>
                          <div className="text-stone-500 text-[10px]">匹配分</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 方案详情页面 */}
        {step === "detail" && selectedBuild && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">{selectedBuild["推荐名称"]}</h2>

            <div className="space-y-4">
              <div className="bg-stone-700/20 rounded-lg p-4">
                <h3 className="text-amber-200 text-sm font-medium mb-3">核心配置</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-stone-500">种族：</span>
                    <span className="text-stone-200">{RACE_NAME_MAP[selectedBuild.Species] || selectedBuild.Species}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">职业：</span>
                    <span className="text-stone-200">{CLASS_NAME_MAP[selectedBuild.Class] || selectedBuild.Class}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">子职：</span>
                    <span className="text-stone-200">{SUBCLASS_MAP[selectedBuild.Subclass] || selectedBuild.Subclass}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">背景：</span>
                    <span className="text-stone-200">{BACKGROUND_MAP[selectedBuild.Background] || selectedBuild.Background}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">起始专长：</span>
                    <span className="text-stone-200">{selectedBuild["Origin Feat"]}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">操作复杂度：</span>
                    <span className="text-stone-200">{selectedBuild["操作复杂度"]}</span>
                  </div>
                </div>
              </div>

              <div className="bg-stone-700/20 rounded-lg p-4">
                <h3 className="text-amber-200 text-sm font-medium mb-2">推荐属性</h3>
                <p className="text-stone-300 text-sm">{selectedBuild["推荐属性"]}</p>
              </div>

              <div className="bg-stone-700/20 rounded-lg p-4">
                <h3 className="text-amber-200 text-sm font-medium mb-2">核心玩法循环</h3>
                <p className="text-stone-300 text-sm">{selectedBuild["核心玩法循环"]}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-700/30">
                  <h3 className="text-emerald-300 text-sm font-medium mb-2">优点</h3>
                  <p className="text-emerald-200/70 text-sm">{selectedBuild["优点"]}</p>
                </div>
                <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
                  <h3 className="text-red-300 text-sm font-medium mb-2">踩坑预警</h3>
                  <p className="text-red-200/70 text-sm">{selectedBuild["风险/踩坑"]}</p>
                </div>
              </div>

              <div className="bg-stone-700/20 rounded-lg p-4">
                <h3 className="text-amber-200 text-sm font-medium mb-2">DM备注/兼容性</h3>
                <p className="text-stone-400 text-sm">{selectedBuild["DM备注/兼容性"]}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep("results")}
                className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors font-semibold text-sm"
              >
                返回选择其他方案
              </button>
              <button
                onClick={handleConfirmCreate}
                className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg transition-colors font-semibold text-sm"
              >
                确认创建角色
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}