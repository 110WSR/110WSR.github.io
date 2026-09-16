// ============================================================================
// 技能熟练选择面板（车卡流程，参照 DND车卡大师"技能"步骤）
// 来源：职业技能（职业列表选 N）+ 背景技能（固定 2 项，冲突时改选）
//      + 物种技能（如 2024 人类的"技能"自选 1 项）+ 专精（游荡者等，已在熟练中选）
// ============================================================================
import { useState } from "react";
import {
  getClassDetail,
  getBackgroundSkills,
  getSpeciesSkillChoiceCount,
  getRuleset,
} from "../../shared/utils/rulesService";

/** 所有 18 项技能列表 */
const ALL_SKILLS = [
  { name: "体操", attr: "敏捷" },
  { name: "驯兽", attr: "感知" },
  { name: "奥秘", attr: "智力" },
  { name: "运动", attr: "力量" },
  { name: "欺瞒", attr: "魅力" },
  { name: "历史", attr: "智力" },
  { name: "洞悉", attr: "感知" },
  { name: "威吓", attr: "魅力" },
  { name: "调查", attr: "智力" },
  { name: "医药", attr: "感知" },
  { name: "自然", attr: "智力" },
  { name: "察觉", attr: "感知" },
  { name: "表演", attr: "魅力" },
  { name: "游说", attr: "魅力" },
  { name: "巧手", attr: "敏捷" },
  { name: "隐匿", attr: "敏捷" },
  { name: "求生", attr: "感知" },
];

/** 5E(2014) 职业技能表（2014 PHB；战士列表不含体操） */
const CLASS_SKILLS_5E: Record<string, { skills: string[]; count: number }> = {
  "野蛮人": { skills: ["驯兽", "运动", "威吓", "自然", "察觉", "求生"], count: 2 },
  "吟游诗人": { skills: ["体操", "驯兽", "欺瞒", "洞悉", "威吓", "调查", "医药", "自然", "察觉", "表演", "游说", "巧手", "隐匿", "求生"], count: 3 },
  "牧师": { skills: ["历史", "洞悉", "医药", "游说", "宗教"], count: 2 },
  "德鲁伊": { skills: ["奥秘", "驯兽", "洞悉", "医药", "自然", "察觉", "宗教", "求生"], count: 2 },
  "战士": { skills: ["驯兽", "运动", "历史", "洞悉", "威吓", "调查", "察觉", "求生"], count: 2 },
  "武僧": { skills: ["体操", "运动", "历史", "洞悉", "宗教", "隐匿"], count: 2 },
  "圣武士": { skills: ["运动", "洞悉", "威吓", "医药", "游说", "宗教"], count: 2 },
  "游侠": { skills: ["驯兽", "运动", "洞悉", "调查", "自然", "察觉", "隐匿", "求生"], count: 3 },
  "游荡者": { skills: ["体操", "欺瞒", "洞悉", "威吓", "调查", "察觉", "表演", "游说", "巧手", "隐匿"], count: 4 },
  "术士": { skills: ["奥秘", "欺瞒", "洞悉", "威吓", "游说", "宗教"], count: 2 },
  "魔契师": { skills: ["奥秘", "欺瞒", "历史", "威吓", "调查", "自然", "宗教"], count: 2 },
  "邪术师": { skills: ["奥秘", "欺瞒", "历史", "威吓", "调查", "自然", "宗教"], count: 2 },
  "法师": { skills: ["奥秘", "历史", "洞悉", "调查", "医药", "宗教"], count: 2 },
};

/** 专精名额：2024 游荡者 1 级 2 项、6 级共 4 项；吟游诗人 9 级 2 项 */
function getExpertiseCount(className: string, level: number): number {
  if (className === "游荡者") return level >= 6 ? 4 : 2;
  if (className === "吟游诗人" || className === "诗人") return level >= 9 ? 2 : 0;
  return 0;
}

export interface SkillSelection {
  classSkills: string[];
  speciesSkills: string[];
  expertiseSkills: string[];
  /** 背景固定技能与职业/物种选择重复时，改选技能（原技能名 → 改选项） */
  bgOverrides: Record<string, string>;
}

export const EMPTY_SKILL_SELECTION: SkillSelection = {
  classSkills: [],
  speciesSkills: [],
  expertiseSkills: [],
  bgOverrides: {},
};

export default function SkillSelectionPanel({ className, level, race, background, selection, onChange }: {
  className: string;
  level: number;
  race: string;
  background: string;
  selection: SkillSelection;
  onChange: (sel: SkillSelection) => void;
}) {
  const [filter, setFilter] = useState<"all" | "picked">("all");
  const ruleset = getRuleset();

  // 职业技能来源：5R 用 2024 数据集；5E 用 2014 表
  let classInfo: { skills: string[]; count: number } | null = null;
  if (className) {
    if (ruleset === "5e2014") {
      classInfo = CLASS_SKILLS_5E[className] ?? null;
    } else {
      const detail = getClassDetail(className);
      if (detail) classInfo = { skills: detail.skillOptionsList, count: detail.skillOptionsCount };
    }
  }

  const bgSkills = getBackgroundSkills(background);
  const speciesCount = getSpeciesSkillChoiceCount(race);
  const expertiseCount = getExpertiseCount(className, level);

  const { classSkills, speciesSkills, expertiseSkills, bgOverrides } = selection;

  // 背景技能实际生效值（冲突的用改选项）
  const effectiveBg = bgSkills.map((s) => bgOverrides[s] ?? s);
  const allProficient = [...new Set([...classSkills, ...speciesSkills, ...effectiveBg])];

  const toggle = (list: string[], name: string, max: number): string[] => {
    if (list.includes(name)) return list.filter((s) => s !== name);
    if (list.length >= max) return list;
    return [...list, name];
  };

  const renderSkillGrid = (
    skills: Array<{ name: string; attr: string }>,
    picked: string[],
    max: number,
    onToggle: (name: string) => void,
    opts?: { showAll?: boolean; disabledNames?: string[]; badge?: (name: string) => string | null }
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {skills.map((skill) => {
        const isPicked = picked.includes(skill.name);
        const disabled = opts?.disabledNames?.includes(skill.name) ?? false;
        const isMaxed = !isPicked && !disabled && picked.length >= max;
        const visible = opts?.showAll || isPicked;
        if (!visible) return null;
        const badge = opts?.badge?.(skill.name);
        return (
          <button
            key={skill.name}
            type="button"
            onClick={() => !disabled && !isMaxed && onToggle(skill.name)}
            disabled={disabled}
            className={
              "px-3 py-2 rounded-md text-xs transition-all duration-200 text-left flex items-center justify-between gap-1 " +
              (isPicked
                ? "bg-amber-700/50 text-amber-200 border border-amber-600/50"
                : disabled
                  ? "bg-stone-900/30 text-stone-600 border border-stone-800/50 cursor-not-allowed opacity-50"
                  : isMaxed
                    ? "bg-stone-900/30 text-stone-500 border border-stone-800/50 opacity-60"
                    : "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50")
            }
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{skill.name}</span>
              {badge && (
                <span className="text-[9px] px-1 rounded bg-emerald-800/60 text-emerald-200 flex-shrink-0">
                  {badge}
                </span>
              )}
            </span>
            <span className="text-[10px] opacity-60 flex-shrink-0">({skill.attr})</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 职业技能 */}
      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-stone-200 text-sm font-semibold">职业技能</h3>
          <span className="text-stone-500 text-xs">
            {classInfo
              ? `从职业列表中选择 ${classInfo.count} 项（已选 ${classSkills.length}/${classInfo.count}）`
              : "请先在基本信息中选择职业"}
          </span>
        </div>
        {classInfo &&
          renderSkillGrid(
            ALL_SKILLS.filter((s) => classInfo!.skills.includes(s.name)),
            classSkills,
            classInfo.count,
            (name) => onChange({ ...selection, classSkills: toggle(classSkills, name, classInfo!.count) }),
            { showAll: true }
          )}
      </div>

      {/* 背景技能（固定，冲突改选） */}
      {bgSkills.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-stone-200 text-sm font-semibold">背景技能</h3>
            <span className="text-stone-500 text-xs">背景提供固定技能（与职业/物种重复时需改选）</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {bgSkills.map((s) => {
              const conflict = classSkills.includes(s) || speciesSkills.includes(s);
              const shown = bgOverrides[s] ?? s;
              return (
                <div
                  key={s}
                  className={`px-3 py-1.5 rounded-md text-xs border flex items-center gap-2 ${
                    conflict
                      ? "bg-amber-900/20 border-amber-700/40 text-amber-200"
                      : "bg-stone-800/60 border-stone-700/50 text-stone-300"
                  }`}
                >
                  {conflict && <span className="text-amber-400">⚠</span>}
                  <span>{shown}</span>
                  {conflict && (
                    <select
                      value={bgOverrides[s] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const next = { ...bgOverrides };
                        if (v) next[s] = v;
                        else delete next[s];
                        onChange({ ...selection, bgOverrides: next });
                      }}
                      className="bg-stone-900 border border-stone-700 rounded text-stone-200 text-[11px] px-1 py-0.5 outline-none focus:border-amber-600/50"
                    >
                      <option value="">改选…</option>
                      {ALL_SKILLS.map((sk) => (
                        <option key={sk.name} value={sk.name}>
                          {sk.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 物种技能 */}
      {speciesCount > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-stone-200 text-sm font-semibold">{ruleset === "5e2014" ? "种族" : "物种"}技能</h3>
            <span className="text-stone-500 text-xs">
              {race} 授予 {speciesCount} 项自选技能（已选 {speciesSkills.length}/{speciesCount}）
            </span>
          </div>
          {renderSkillGrid(
            ALL_SKILLS,
            speciesSkills,
            speciesCount,
            (name) => onChange({ ...selection, speciesSkills: toggle(speciesSkills, name, speciesCount) }),
            { showAll: filter === "all" }
          )}
          <button
            type="button"
            onClick={() => setFilter(filter === "all" ? "picked" : "all")}
            className="mt-2 text-stone-500 hover:text-stone-300 text-[11px] underline underline-offset-2"
          >
            {filter === "all" ? "只显示已选" : "显示全部技能"}
          </button>
        </div>
      )}

      {/* 专精 */}
      {expertiseCount > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-stone-200 text-sm font-semibold">专精</h3>
            <span className="text-stone-500 text-xs">
              {className === "游荡者"
                ? `专精特性：从已熟练技能中选 ${expertiseCount} 项，熟练加值翻倍（已选 ${expertiseSkills.length}/${expertiseCount}）`
                : `从已熟练技能中选 ${expertiseCount} 项，熟练加值翻倍（已选 ${expertiseSkills.length}/${expertiseCount}）`}
            </span>
          </div>
          {allProficient.length === 0 ? (
            <p className="text-stone-500 text-xs">请先在上方取得技能熟练</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allProficient.map((name) => {
                const isOn = expertiseSkills.includes(name);
                const isMaxed = !isOn && expertiseSkills.length >= expertiseCount;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      !isMaxed &&
                      onChange({
                        ...selection,
                        expertiseSkills: toggle(expertiseSkills, name, expertiseCount),
                      })
                    }
                    className={
                      "px-3 py-1.5 rounded-md text-xs border transition-colors " +
                      (isOn
                        ? "bg-emerald-800/50 text-emerald-200 border-emerald-600/50"
                        : isMaxed
                          ? "bg-stone-900/30 text-stone-500 border-stone-800/50 opacity-60"
                          : "bg-stone-800/50 text-stone-400 border-stone-700/50 hover:border-stone-600/50")
                    }
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
