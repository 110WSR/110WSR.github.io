import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCharacter } from "../shared/storage/CharacterContext";
import type { Attributes } from "../shared/storage/types";

// ============================================================================
// 属性生成方式类型
// ============================================================================
type AttributeMethod = "standard" | "random" | "recommended" | "manual";

// ============================================================================
// 预设推荐属性数组（标准职业推荐）
// ============================================================================
const RECOMMENDED_BUILDS: { label: string; attrs: Attributes }[] = [
  {
    label: "战士/圣武士（力量型）",
    attrs: { str_value: 15, dex_value: 13, con_value: 14, int_value: 10, wis_value: 12, cha_value: 8 },
  },
  {
    label: "游侠/武僧（敏捷型）",
    attrs: { str_value: 10, dex_value: 15, con_value: 14, int_value: 12, wis_value: 13, cha_value: 8 },
  },
  {
    label: "法师/术士（施法型）",
    attrs: { str_value: 8, dex_value: 14, con_value: 13, int_value: 15, wis_value: 12, cha_value: 10 },
  },
  {
    label: "牧师/德鲁伊（感知型）",
    attrs: { str_value: 12, dex_value: 10, con_value: 14, int_value: 8, wis_value: 15, cha_value: 13 },
  },
  {
    label: "游荡者/诗人（魅力型）",
    attrs: { str_value: 8, dex_value: 15, con_value: 13, int_value: 12, wis_value: 10, cha_value: 14 },
  },
  {
    label: "邪术师（魅力战斗型）",
    attrs: { str_value: 10, dex_value: 14, con_value: 13, int_value: 8, wis_value: 12, cha_value: 15 },
  },
];

// ============================================================================
// 标准购点法（官方 27 点购点）
// ============================================================================
const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const POINT_BUY_TOTAL = 27;

// ============================================================================
// 随机生成属性（4d6 取最高 3 个）
// ============================================================================
function roll4d6DropLowest(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

function generateRandomAttributes(): Attributes {
  const values = Array.from({ length: 6 }, () => roll4d6DropLowest());
  values.sort((a, b) => b - a);
  return {
    str_value: values[0],
    dex_value: values[1],
    con_value: values[2],
    int_value: values[3],
    wis_value: values[4],
    cha_value: values[5],
  };
}

// ============================================================================
// 属性字段配置
// ============================================================================
const ATTRIBUTE_FIELDS: { key: keyof Attributes; label: string; abbr: string }[] = [
  { key: "str_value", label: "力量", abbr: "STR" },
  { key: "dex_value", label: "敏捷", abbr: "DEX" },
  { key: "con_value", label: "体质", abbr: "CON" },
  { key: "int_value", label: "智力", abbr: "INT" },
  { key: "wis_value", label: "感知", abbr: "WIS" },
  { key: "cha_value", label: "魅力", abbr: "CHA" },
];

function calcMod(val: number): string {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ============================================================================
// 步骤指示器
// ============================================================================
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              index === currentStep
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                : index < currentStep
                ? "bg-amber-800/50 text-amber-300"
                : "bg-stone-700 text-stone-500"
            }`}
          >
            {index < currentStep ? "✓" : index + 1}
          </div>
          <span
            className={`text-sm hidden sm:block ${
              index === currentStep ? "text-amber-300" : "text-stone-500"
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${index < currentStep ? "bg-amber-700" : "bg-stone-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 属性输入组件
// ============================================================================
function AttributeInput({
  label,
  abbr,
  value,
  onChange,
  min = 3,
  max = 18,
  remainingPoints,
}: {
  label: string;
  abbr: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  remainingPoints?: number;
}) {
  const mod = calcMod(value);
  const canDecrease = value > min;
  const canIncrease = value < max && (remainingPoints === undefined || (POINT_BUY_COST[value + 1] !== undefined && remainingPoints >= POINT_BUY_COST[value + 1]));

  return (
    <div className="flex flex-col items-center bg-stone-800/50 rounded-lg p-3 border border-stone-700/50 min-w-[90px]">
      <div className="text-amber-400/80 text-xs font-semibold tracking-wider mb-1">{abbr}</div>
      <div className="text-stone-400 text-xs mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:cursor-not-allowed
                     text-stone-300 flex items-center justify-center transition-colors text-sm font-bold"
        >
          -
        </button>
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v >= min && v <= max) onChange(v);
            }}
            className="w-14 h-10 text-center bg-stone-900 border border-stone-600 rounded text-amber-100
                       font-bold text-lg outline-none focus:border-amber-500 transition-colors
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="absolute -bottom-4 left-0 right-0 text-center text-xs text-stone-500">
            {mod}
          </div>
        </div>
        <button
          onClick={() => canIncrease && onChange(value + 1)}
          disabled={!canIncrease}
          className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:cursor-not-allowed
                     text-stone-300 flex items-center justify-center transition-colors text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 购点法面板
// ============================================================================
function PointBuyPanel({
  attributes,
  onAttributeChange,
}: {
  attributes: Attributes;
  onAttributeChange: (key: keyof Attributes, val: number) => void;
}) {
  const usedPoints = useMemo(() => {
    let total = 0;
    for (const field of ATTRIBUTE_FIELDS) {
      const val = attributes[field.key];
      total += POINT_BUY_COST[val] ?? 0;
    }
    return total;
  }, [attributes]);

  const remaining = POINT_BUY_TOTAL - usedPoints;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-stone-400 text-sm">
          已用点数: <span className="text-amber-400 font-bold">{usedPoints}</span> / {POINT_BUY_TOTAL}
        </div>
        <div className={`text-sm font-bold ${remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          剩余: {remaining}
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTE_FIELDS.map((field) => (
          <AttributeInput
            key={field.key}
            label={field.label}
            abbr={field.abbr}
            value={attributes[field.key]}
            onChange={(val) => onAttributeChange(field.key, val)}
            min={8}
            max={15}
            remainingPoints={remaining}
          />
        ))}
      </div>
      <div className="mt-3 text-stone-500 text-xs text-center">
        每项属性范围 8-15，27 点购点（参考玩家手册）
      </div>
    </div>
  );
}

// ============================================================================
// 随机生成面板
// ============================================================================
function RandomRollPanel({
  attributes,
  onAttributeChange,
  onReroll,
}: {
  attributes: Attributes;
  onAttributeChange: (key: keyof Attributes, val: number) => void;
  onReroll: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-stone-400 text-sm">4d6 取最高 3 个，已按从高到低排序</div>
        <button
          onClick={onReroll}
          className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-md
                     transition-colors text-sm font-medium flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重新投掷
        </button>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTE_FIELDS.map((field) => (
          <AttributeInput
            key={field.key}
            label={field.label}
            abbr={field.abbr}
            value={attributes[field.key]}
            onChange={(val) => onAttributeChange(field.key, val)}
          />
        ))}
      </div>
      <div className="mt-3 text-stone-500 text-xs text-center">
        生成后可自行调整各属性值
      </div>
    </div>
  );
}

// ============================================================================
// 推荐属性面板
// ============================================================================
function RecommendedPanel({
  onSelectBuild,
}: {
  onSelectBuild: (attrs: Attributes) => void;
}) {
  return (
    <div>
      <div className="text-stone-400 text-sm mb-4">选择一个职业推荐属性配置：</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {RECOMMENDED_BUILDS.map((build) => (
          <button
            key={build.label}
            onClick={() => onSelectBuild(build.attrs)}
            className="text-left px-4 py-3 rounded-lg bg-stone-800/50 hover:bg-stone-700/50 border border-stone-700/50
                       hover:border-amber-600/50 transition-all duration-200 group"
          >
            <div className="text-stone-300 group-hover:text-amber-300 text-sm font-medium mb-1.5">
              {build.label}
            </div>
            <div className="flex gap-1.5">
              {ATTRIBUTE_FIELDS.map((field) => (
                <span
                  key={field.key}
                  className="text-xs px-1.5 py-0.5 rounded bg-stone-900 text-stone-400"
                  title={field.label}
                >
                  {field.abbr}:{build.attrs[field.key]}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 手动填数面板
// ============================================================================
function ManualInputPanel({
  attributes,
  onAttributeChange,
}: {
  attributes: Attributes;
  onAttributeChange: (key: keyof Attributes, val: number) => void;
}) {
  return (
    <div>
      <div className="text-stone-400 text-sm mb-4">自由填写属性值（范围 3-18）：</div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTE_FIELDS.map((field) => (
          <AttributeInput
            key={field.key}
            label={field.label}
            abbr={field.abbr}
            value={attributes[field.key]}
            onChange={(val) => onAttributeChange(field.key, val)}
            min={3}
            max={18}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 方法选择器
// ============================================================================
function MethodSelector({
  method,
  onMethodChange,
}: {
  method: AttributeMethod;
  onMethodChange: (m: AttributeMethod) => void;
}) {
  const methods: { value: AttributeMethod; label: string; desc: string }[] = [
    { value: "standard", label: "官方购点法", desc: "27点购点，属性范围8-15" },
    { value: "random", label: "随机生成", desc: "4d6取最高3个，可重新投掷" },
    { value: "recommended", label: "推荐属性", desc: "按职业选择推荐配置" },
    { value: "manual", label: "自行填数", desc: "自由填写3-18" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {methods.map((m) => (
        <button
          key={m.value}
          onClick={() => onMethodChange(m.value)}
          className={`p-3 rounded-lg border text-left transition-all duration-200 ${
            method === m.value
              ? "bg-amber-900/30 border-amber-600/50 shadow-lg shadow-amber-900/20"
              : "bg-stone-800/30 border-stone-700/50 hover:border-stone-600/50 hover:bg-stone-700/30"
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${
            method === m.value ? "text-amber-300" : "text-stone-300"
          }`}>
            {m.label}
          </div>
          <div className="text-xs text-stone-500">{m.desc}</div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// 基本信息表单
// ============================================================================
function BasicInfoForm({
  name,
  onNameChange,
  className: classValue,
  onClassChange,
  race,
  onRaceChange,
  background,
  onBackgroundChange,
  level,
  onLevelChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  className: string;
  onClassChange: (v: string) => void;
  race: string;
  onRaceChange: (v: string) => void;
  background: string;
  onBackgroundChange: (v: string) => void;
  level: number;
  onLevelChange: (v: number) => void;
}) {
  const CLASS_OPTIONS = [
    "战士", "圣武士", "游侠", "武僧", "游荡者",
    "法师", "术士", "邪术师", "牧师", "德鲁伊",
    "诗人", "野蛮人", "契术师",
  ];

  const RACE_OPTIONS = [
    "人类", "精灵", "矮人", "半身人", "侏儒",
    "半精灵", "半兽人", "龙裔", "提夫林",
  ];

  const BACKGROUND_OPTIONS = [
    "侍僧", "骗子", "艺人", "平民英雄", "罪犯",
    "贵族", "贤者", "士兵", "化外之民", "水手",
    "工匠", "佣兵",
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-stone-400 text-xs tracking-wider mb-1.5">角色名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="输入角色名..."
            className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200
                       outline-none focus:border-amber-600/50 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-stone-400 text-xs tracking-wider mb-1.5">等级</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLevelChange(Math.max(1, level - 1))}
              className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              value={level}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1 && v <= 20) onLevelChange(v);
              }}
              className="w-16 h-8 text-center bg-stone-900 border border-stone-700 rounded text-amber-100
                         font-bold outline-none focus:border-amber-600/50 text-sm"
            />
            <button
              onClick={() => onLevelChange(Math.min(20, level + 1))}
              className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="block text-stone-400 text-xs tracking-wider mb-1.5">职业</label>
          <select
            value={classValue}
            onChange={(e) => onClassChange(e.target.value)}
            className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200
                       outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="">选择职业...</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-stone-400 text-xs tracking-wider mb-1.5">种族</label>
          <select
            value={race}
            onChange={(e) => onRaceChange(e.target.value)}
            className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200
                       outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="">选择种族...</option>
            {RACE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-stone-400 text-xs tracking-wider mb-1.5">背景</label>
          <select
            value={background}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200
                       outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="">选择背景...</option>
            {BACKGROUND_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 主组件
// ============================================================================
export default function CharacterCreator() {
  const navigate = useNavigate();
  const { newCharacter, setAttributes, setBasicInfo, setLevel } = useCharacter();

  const [step, setStep] = useState(0);
  const steps = ["基本信息", "选择方法", "确认属性", "完成"];

  const [method, setMethod] = useState<AttributeMethod>("standard");

  const [charName, setCharName] = useState("");
  const [className, setClassName] = useState("");
  const [race, setRace] = useState("");
  const [background, setBackground] = useState("");
  const [level, setLevelState] = useState(1);

  const [attributes, setLocalAttributes] = useState<Attributes>({
    str_value: 8,
    dex_value: 8,
    con_value: 8,
    int_value: 8,
    wis_value: 8,
    cha_value: 8,
  });

  const handleAttributeChange = useCallback((key: keyof Attributes, val: number) => {
    setLocalAttributes((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleReroll = useCallback(() => {
    setLocalAttributes(generateRandomAttributes());
  }, []);

  const handleSelectBuild = useCallback((attrs: Attributes) => {
    setLocalAttributes(attrs);
  }, []);

  const handleMethodChange = useCallback((m: AttributeMethod) => {
    setMethod(m);
    if (m === "random") {
      setLocalAttributes(generateRandomAttributes());
    } else if (m === "standard") {
      setLocalAttributes({
        str_value: 8, dex_value: 8, con_value: 8,
        int_value: 8, wis_value: 8, cha_value: 8,
      });
    } else if (m === "manual") {
      setLocalAttributes({
        str_value: 10, dex_value: 10, con_value: 10,
        int_value: 10, wis_value: 10, cha_value: 10,
      });
    }
  }, []);

  const handleFinish = useCallback(() => {
    const finalName = charName.trim() || "未命名角色";
    newCharacter(finalName);
    setAttributes(attributes);
    setBasicInfo({
      职业: className,
      种族: race,
      背景: background,
      阵营: "",
      玩家名: "",
      经验值: "",
    });
    setLevel(level);
    navigate("/sheet");
  }, [charName, className, race, background, level, attributes, newCharacter, setAttributes, setBasicInfo, setLevel, navigate]);

  const attributeSummary = useMemo(() => {
    return ATTRIBUTE_FIELDS.reduce((sum, f) => sum + attributes[f.key], 0);
  }, [attributes]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
      <div className="border-b border-stone-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回主菜单
          </button>
          <div className="text-stone-500 text-sm">创建新角色</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator currentStep={step} steps={steps} />

        <div className="bg-stone-800/30 rounded-xl border border-stone-700/50 p-6 md:p-8">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-amber-100 mb-6">角色基本信息</h2>
              <BasicInfoForm
                name={charName}
                onNameChange={setCharName}
                className={className}
                onClassChange={setClassName}
                race={race}
                onRaceChange={setRace}
                background={background}
                onBackgroundChange={setBackground}
                level={level}
                onLevelChange={setLevelState}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-amber-100 mb-6">选择属性生成方式</h2>
              <MethodSelector method={method} onMethodChange={handleMethodChange} />
              <div className="mt-6">
                {method === "standard" && (
                  <PointBuyPanel attributes={attributes} onAttributeChange={handleAttributeChange} />
                )}
                {method === "random" && (
                  <RandomRollPanel attributes={attributes} onAttributeChange={handleAttributeChange} onReroll={handleReroll} />
                )}
                {method === "recommended" && (
                  <RecommendedPanel onSelectBuild={handleSelectBuild} />
                )}
                {method === "manual" && (
                  <ManualInputPanel attributes={attributes} onAttributeChange={handleAttributeChange} />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-amber-100 mb-6">确认角色属性</h2>
              <div className="bg-stone-900/50 rounded-lg p-6 border border-stone-700/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-stone-700/50">
                  <div>
                    <div className="text-stone-500 text-xs">角色名</div>
                    <div className="text-stone-200 font-medium">{charName || "未命名"}</div>
                  </div>
                  <div>
                    <div className="text-stone-500 text-xs">职业</div>
                    <div className="text-stone-200 font-medium">{className || "未选择"}</div>
                  </div>
                  <div>
                    <div className="text-stone-500 text-xs">种族</div>
                    <div className="text-stone-200 font-medium">{race || "未选择"}</div>
                  </div>
                  <div>
                    <div className="text-stone-500 text-xs">等级</div>
                    <div className="text-stone-200 font-medium">{level}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {ATTRIBUTE_FIELDS.map((field) => (
                    <div key={field.key} className="text-center p-3 rounded-lg bg-stone-800/50">
                      <div className="text-amber-400/80 text-xs font-semibold">{field.abbr}</div>
                      <div className="text-stone-400 text-xs mb-1">{field.label}</div>
                      <div className="text-2xl font-bold text-amber-100">{attributes[field.key]}</div>
                      <div className="text-sm text-stone-500">{calcMod(attributes[field.key])}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-stone-500 text-sm">
                  属性总值: <span className="text-amber-300 font-bold">{attributeSummary}</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-amber-700/30 border-2 border-amber-600/50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-amber-100 mb-2">角色创建完成！</h2>
              <p className="text-stone-400 mb-8">
                {charName || "未命名角色"} · {className || "无职业"} · Lv.{level}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors text-sm"
                >
                  返回修改
                </button>
                <button
                  onClick={handleFinish}
                  className="px-8 py-2.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg
                             transition-colors text-sm font-semibold shadow-lg shadow-amber-900/30"
                >
                  进入角色卡
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-700/50">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-5 py-2 bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:cursor-not-allowed
                         text-stone-200 rounded-lg transition-colors text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一步
            </button>

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 2) {
                    setStep(3);
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={step === 0 && !charName.trim() && !className}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed
                           text-amber-50 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1.5"
              >
                下一步
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}