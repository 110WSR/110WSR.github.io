import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCharacter } from "../shared/storage/CharacterContext";
import type { Attributes, Personality, SavingThrows } from "../shared/storage/types";
import type { Item, AttackEntry, SpellData } from "../shared/types/types";
import { createDefaultItem } from "../shared/types/types";
import weaponPresets from "../../data/weaponPresets.json";
import HPRollPanel from "./HPRollPanel";
import StepIndicator from "./creator/StepIndicator";
import BasicInfoForm from "./creator/BasicInfoForm";
import MethodSelector from "./creator/MethodSelector";
import PointBuyPanel from "./creator/PointBuyPanel";
import RandomRollPanel from "./creator/RandomRollPanel";
import RecommendedPanel from "./creator/RecommendedPanel";
import ManualInputPanel from "./creator/ManualInputPanel";
import EquipmentSelectionPanel from "./creator/EquipmentSelectionPanel";
import SkillSelectionPanel from "./creator/SkillSelectionPanel";
import CharacterDetailsPanel from "./creator/CharacterDetailsPanel";
import SubclassSelectionPanel from "./creator/SubclassSelectionPanel";
import SpellSelectionPanel from "./creator/SpellSelectionPanel";
import type { SubclassFeature } from "./creator/SubclassSelectionPanel";
import { ATTRIBUTE_FIELDS, generateRandomAttributes, RACE_ABILITY_BONUSES, CLASS_PRIMARY_ATTRIBUTES } from "./creator/types";
import type { AttributeMethod } from "./creator/types";
import classIdentifiers from "../../data/classIdentifiers.json";
import { generateTraits } from "../shared/utils/traitGenerator";

/** 根据职业中文名查找对应的 classId */
function findClassId(className: string): string {
  if (!className) return "";
  const entry = classIdentifiers.find((c: any) =>
    c.labels.some((l: string) => l === className)
  );
  return entry?.id ?? "";
}

/** 各职业默认熟练豁免映射 */
const CLASS_SAVING_THROWS: Record<string, { strength?: boolean; dexterity?: boolean; constitution?: boolean; intelligence?: boolean; wisdom?: boolean; charisma?: boolean }> = {
  barbarian: { strength: true, constitution: true },
  bard: { dexterity: true, charisma: true },
  cleric: { wisdom: true, charisma: true },
  druid: { intelligence: true, wisdom: true },
  fighter: { strength: true, constitution: true },
  monk: { strength: true, dexterity: true },
  paladin: { wisdom: true, charisma: true },
  ranger: { strength: true, dexterity: true },
  rogue: { dexterity: true, intelligence: true },
  sorcerer: { constitution: true, charisma: true },
  warlock: { wisdom: true, charisma: true },
  wizard: { intelligence: true, wisdom: true },
  artificer: { constitution: true, intelligence: true },
  bloodhunter: { strength: true, wisdom: true },
};

/** 职业子职等级映射 */
const SUBCLASS_LEVELS: Record<string, number> = {
  "野蛮人": 3,
  "吟游诗人": 3,
  "牧师": 1,
  "德鲁伊": 2,
  "战士": 3,
  "武僧": 3,
  "圣武士": 3,
  "游侠": 3,
  "游荡者": 3,
  "术士": 1,
  "邪术师": 1,
  "法师": 2,
};

/** 施法职业列表 */
const SPELLCASTING_CLASSES = ["吟游诗人", "牧师", "德鲁伊", "圣武士", "游侠", "术士", "邪术师", "法师"];

/** 将种族属性加成应用到基础属性上 */
function applyRaceBonuses(baseAttrs: Attributes, race: string): Attributes {
  const raceBonus = RACE_ABILITY_BONUSES[race];
  if (!raceBonus) return { ...baseAttrs };
  const result = { ...baseAttrs };
  for (const key of Object.keys(raceBonus.bonuses) as (keyof Attributes)[]) {
    const bonus = raceBonus.bonuses[key];
    if (bonus) {
      result[key] = Math.min(20, result[key] + bonus);
    }
  }
  return result;
}

export default function CharacterCreator() {
  const navigate = useNavigate();
  const { character, newCharacter, setAttributes, setBasicInfo, setLevel, setPersonality, setEquipment, setBackstory, updateCharacter } = useCharacter();

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<AttributeMethod>("standard");

  const [charName, setCharName] = useState("");
  const [className, setClassName] = useState("");
  const [race, setRace] = useState("");
  const [background, setBackground] = useState("");
  const [level, setLevelState] = useState(1);

  const [attributes, setLocalAttributes] = useState<Attributes>({
    str_value: 8, dex_value: 8, con_value: 8, int_value: 8, wis_value: 8, cha_value: 8,
  });

  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedArmor, setSelectedArmor] = useState<string>("");
  const [hasShield, setHasShield] = useState(false);
  const [equipmentText, setEquipmentText] = useState("");

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [alignment, setAlignment] = useState("");
  const [localPersonality, setLocalPersonality] = useState<Personality>({
    个性特点: "", 理想: "", 牵绊: "", 缺点: "",
  });
  const [backstory, setBackstoryState] = useState("");

  // 子职相关状态
  const [selectedSubclass, setSelectedSubclass] = useState<string>("");
  const [subclassFeatures, setSubclassFeatures] = useState<SubclassFeature[]>([]);

  // 法术选择状态
  const [selectedSpells, setSelectedSpells] = useState<Record<string, string[]>>({});

  const handleAttributeChange = useCallback((key: keyof Attributes, val: number) => {
    setLocalAttributes((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleReroll = useCallback(() => {
    setLocalAttributes(generateRandomAttributes());
  }, []);

  const handleSelectBuild = useCallback((attrs: Attributes) => {
    // 选择推荐属性后，自动加上种族属性加成
    const attrsWithRace = applyRaceBonuses(attrs, race);
    setLocalAttributes(attrsWithRace);
  }, [race]);

  const handleMethodChange = useCallback((m: AttributeMethod) => {
    setMethod(m);
    if (m === "random") { setLocalAttributes(generateRandomAttributes()); }
    else if (m === "standard") { setLocalAttributes({ str_value: 8, dex_value: 8, con_value: 8, int_value: 8, wis_value: 8, cha_value: 8 }); }
    else if (m === "manual") { setLocalAttributes({ str_value: 10, dex_value: 10, con_value: 10, int_value: 10, wis_value: 10, cha_value: 10 }); }
  }, []);

  const [currentHP, setCurrentHPState] = useState(0);
  const [maxHP, setMaxHP] = useState(0);

  const handleHPChange = useCallback((cur: number, max: number) => {
    setCurrentHPState(cur);
    setMaxHP(max);
  }, []);

  // 子职变更处理
  const handleSubclassChange = useCallback((subclassId: string, features: SubclassFeature[]) => {
    setSelectedSubclass(subclassId);
    setSubclassFeatures(features);
  }, []);

  // 判断是否需要显示子职页面
  const needsSubclassPage = useMemo(() => {
    if (!className) return false;
    const subclassLevel = SUBCLASS_LEVELS[className];
    if (!subclassLevel) return false;
    return level >= subclassLevel;
  }, [className, level]);

  // 判断是否需要显示法术选择页面
  const needsSpellPage = useMemo(() => {
    if (!className) return false;
    return SPELLCASTING_CLASSES.includes(className);
  }, [className]);

  // 动态步骤列表
  const steps = useMemo(() => {
    const base = ["基本信息", "选择方法", "确认属性", "生命值与技能"];
    if (needsSubclassPage) base.push("选择子职");
    if (needsSpellPage) base.push("选择法术");
    base.push("选择装备", "角色细节", "完成");
    return base;
  }, [needsSubclassPage, needsSpellPage]);

  const handleFinish = useCallback(() => {
    const finalName = charName.trim() || "未命名角色";
    const equipParts: string[] = [];
    if (selectedWeapons.length > 0) equipParts.push("武器: " + selectedWeapons.join(", "));
    if (selectedArmor) equipParts.push("护甲: " + selectedArmor);
    if (hasShield) equipParts.push("盾牌");
    if (equipmentText.trim()) equipParts.push(equipmentText.trim());

    const classId = findClassId(className);

    // 创建 Item 对象和攻击栏条目
    const newItems: Item[] = [];
    const newAttackEntries: AttackEntry[] = [];

    // 根据选择的武器名称查找预设
    const weaponPresetList = weaponPresets as any[];
    for (const weaponName of selectedWeapons) {
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

    // 添加护甲作为物品
    if (selectedArmor) {
      const armorItem = createDefaultItem(selectedArmor);
      newItems.push(armorItem);
    }

    // 添加盾牌
    if (hasShield) {
      const shieldItem = createDefaultItem("盾牌");
      newItems.push(shieldItem);
    }

    newCharacter(finalName);
    setAttributes(attributes);
    setBasicInfo({ 职业: className, 职业_id: classId, 种族: race, 背景: background, 阵营: alignment, 玩家名: "", 经验值: "" });
    setLevel(level);
    updateCharacter({ currentHP, customMaxHP: maxHP, items: newItems, attackEntries: newAttackEntries });
    setPersonality(localPersonality);
    setEquipment(equipParts.join("\n"));
    setBackstory(backstory);
    // 根据职业设置默认熟练豁免
    if (classId && CLASS_SAVING_THROWS[classId]) {
      updateCharacter({ savingThrows: CLASS_SAVING_THROWS[classId] as SavingThrows });
    }
    // 保存技能熟练
    const skillsRecord: Record<string, 0 | 1 | 2> = {};
    for (const skillName of selectedSkills) {
      skillsRecord[skillName] = 1;
    }
    updateCharacter({ skills: skillsRecord });
    // 自动生成特性关键词
    const traitList = generateTraits(className, level, race, background);
    // 添加子职特性
    if (selectedSubclass && subclassFeatures.length > 0) {
      const subclassTraitNames = subclassFeatures
        .filter((f) => f.level <= level)
        .map((f) => f.name);
      for (const name of subclassTraitNames) {
        traitList.push({
          id: `subclass_${name}`,
          name,
          description: "",
          tags: ["子职"],
        });
      }
    }
    if (traitList.length > 0) {
      updateCharacter({ traitList });
    }
    // 保存法术选择 - 将 selectedSpells 转换为 spellBoxes 格式
    if (Object.keys(selectedSpells).length > 0) {
      // 先保存原始格式到 spells 字段
      updateCharacter({ spells: selectedSpells as any });
      
      // 同时将法术填充到 spellBoxes 中
      const nextBoxes = [...(character?.spellBoxes ?? [])];
      for (const [levelKey, spellNames] of Object.entries(selectedSpells)) {
        const level = parseInt(levelKey, 10);
        const boxIndex = nextBoxes.findIndex(b => b.level === level);
        if (boxIndex !== -1 && spellNames.length > 0) {
          const spells: SpellData[] = spellNames.map(name => ({
            id: `spell_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            description: "",
            isInnate: false,
            prepared: true,
          }));
          nextBoxes[boxIndex] = {
            ...nextBoxes[boxIndex],
            spells,
            spellCount: Math.max(nextBoxes[boxIndex].spellCount, spells.length),
          };
        }
      }
      updateCharacter({ spellBoxes: nextBoxes });
    }
    navigate("/sheet");
  }, [charName, className, race, background, level, attributes, currentHP, maxHP, alignment, localPersonality, backstory,
      selectedWeapons, selectedArmor, hasShield, equipmentText, selectedSkills, updateCharacter,
      newCharacter, setAttributes, setBasicInfo, setLevel, setPersonality, setEquipment, setBackstory, navigate,
      selectedSubclass, subclassFeatures, selectedSpells, character]);

  const attributeSummary = useMemo(() => ATTRIBUTE_FIELDS.reduce((sum, f) => sum + attributes[f.key], 0), [attributes]);
  const classId = useMemo(() => findClassId(className), [className]);

  // 计算当前步骤对应的页面索引
  const getPageForStep = (s: number) => {
    // 基础步骤映射
    if (s === 0) return "basic";
    if (s === 1) return "method";
    if (s === 2) return "attributes";
    if (s === 3) return "hp_skills";
    
    // 动态步骤
    let idx = 4; // 子职
    if (s === idx) return "subclass";
    
    if (needsSpellPage) {
      idx++; // 5 = 法术
      if (s === idx) return "spells";
    }
    
    idx++; // 装备
    if (s === idx) return "equipment";
    
    idx++; // 角色细节
    if (s === idx) return "details";
    
    idx++; // 完成
    if (s === idx) return "finish";
    
    return "unknown";
  };

  const currentPage = getPageForStep(step);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 mobile-no-overflow">
      <div className="border-b border-stone-700/50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <div className="text-stone-500 text-xs sm:text-sm">创建新角色</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <StepIndicator currentStep={step} steps={steps} />

        {currentPage === "basic" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">基本信息</h2>
            <BasicInfoForm name={charName} onNameChange={setCharName} className={className} onClassChange={setClassName} race={race} onRaceChange={setRace} background={background} onBackgroundChange={setBackground} level={level} onLevelChange={setLevelState} />
          </div>
        )}

        {currentPage === "method" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">选择属性生成方式</h2>
            <MethodSelector method={method} onMethodChange={handleMethodChange} />
          </div>
        )}

        {currentPage === "attributes" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">确认属性值</h2>
            <div className="text-stone-500 text-xs mb-4">当前使用方式: {method === "standard" ? "官方购点法" : method === "random" ? "随机生成" : method === "recommended" ? "推荐属性" : "自行填数"}</div>

            {/* 种族属性加成提示 */}
            {race && RACE_ABILITY_BONUSES[race] && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-emerald-300 text-sm font-medium">种族属性加成：{race}</span>
                </div>
                <p className="text-emerald-200/70 text-xs ml-6">
                  {RACE_ABILITY_BONUSES[race].description} — 选择推荐属性后会自动应用此加成
                </p>
              </div>
            )}

            {/* 职业推荐属性提示 */}
            {className && CLASS_PRIMARY_ATTRIBUTES[className] && (
              <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-amber-300 text-sm font-medium">职业推荐属性：{className}</span>
                </div>
                <p className="text-amber-200/70 text-xs ml-6">
                  {CLASS_PRIMARY_ATTRIBUTES[className].description}
                </p>
              </div>
            )}

            {method === "standard" && <PointBuyPanel attributes={attributes} onAttributeChange={handleAttributeChange} />}
            {method === "random" && <RandomRollPanel attributes={attributes} onAttributeChange={handleAttributeChange} onReroll={handleReroll} />}
            {method === "recommended" && <RecommendedPanel onSelectBuild={handleSelectBuild} />}
            {method === "manual" && <ManualInputPanel attributes={attributes} onAttributeChange={handleAttributeChange} />}
            <div className="mt-4 text-center text-stone-500 text-xs">属性总和: {attributeSummary}</div>
          </div>
        )}

        {currentPage === "hp_skills" && (
          <div className="space-y-4">
            <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
              <h2 className="text-amber-300 text-lg font-semibold mb-4">投掷生命值</h2>
              {classId ? (
                <HPRollPanel
                  classId={classId}
                  level={level}
                  conValue={attributes.con_value}
                  onHPChange={handleHPChange}
                />
              ) : (
                <p className="text-stone-400 text-sm">请先在基本信息中选择职业</p>
              )}
            </div>

            <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
              <h2 className="text-amber-300 text-lg font-semibold mb-4">选择技能熟练项</h2>
              <p className="text-stone-400 text-sm mb-4">根据你的职业选择熟练的技能（点击切换）</p>
              <SkillSelectionPanel
                className={className}
                selectedSkills={selectedSkills}
                onSkillsChange={setSelectedSkills}
              />
            </div>
          </div>
        )}

        {currentPage === "subclass" && needsSubclassPage && (
          <SubclassSelectionPanel
            className={className}
            level={level}
            selectedSubclass={selectedSubclass}
            onSubclassChange={handleSubclassChange}
          />
        )}

        {currentPage === "subclass" && !needsSubclassPage && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
            <p className="text-stone-400 text-sm">该职业在等级 {level} 时无需选择子职</p>
          </div>
        )}

        {currentPage === "spells" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">选择法术</h2>
            <p className="text-stone-400 text-sm mb-4">根据你的职业和等级选择已知法术</p>
            <SpellSelectionPanel
              className={className}
              level={level}
              selectedSubclass={selectedSubclass}
              subclassFeatures={subclassFeatures}
              selectedSpells={selectedSpells}
              onSpellsChange={setSelectedSpells}
            />
          </div>
        )}

        {currentPage === "equipment" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">选择装备</h2>
            <EquipmentSelectionPanel
              selectedWeapons={selectedWeapons} onWeaponsChange={setSelectedWeapons}
              selectedArmor={selectedArmor} onArmorChange={setSelectedArmor}
              hasShield={hasShield} onShieldChange={setHasShield}
              equipmentText={equipmentText} onEquipmentTextChange={setEquipmentText}
              className={className}
            />
          </div>
        )}

        {currentPage === "details" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">角色细节</h2>
            <CharacterDetailsPanel
              alignment={alignment} onAlignmentChange={setAlignment}
              personality={localPersonality} onPersonalityChange={setLocalPersonality}
              backstory={backstory} onBackstoryChange={setBackstoryState}
            />
          </div>
        )}

        {currentPage === "finish" && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-700/30 border-2 border-amber-600/50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-amber-300 text-xl font-bold mb-2">角色创建完成！</h2>
            <p className="text-stone-400 text-sm mb-6">以下是你的角色摘要</p>

            <div className="max-w-md mx-auto text-left space-y-2 mb-8">
              <div className="flex justify-between text-sm"><span className="text-stone-400">角色名</span><span className="text-stone-200 font-medium">{charName || "未命名角色"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-stone-400">职业</span><span className="text-stone-200">{className || "未选择"}</span></div>
              {selectedSubclass && (
                <div className="flex justify-between text-sm"><span className="text-stone-400">子职</span><span className="text-stone-200">{subclassFeatures.length > 0 ? subclassFeatures[0].name : selectedSubclass}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-stone-400">种族</span><span className="text-stone-200">{race || "未选择"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-stone-400">生命值</span><span className="text-stone-200">{currentHP} / {maxHP}</span></div>
              <div className="flex justify-between text-sm"><span className="text-stone-400">背景</span><span className="text-stone-200">{background || "未选择"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-stone-400">等级</span><span className="text-stone-200">{level}</span></div>
              <div className="border-t border-stone-700/50 pt-2 mt-2">
                <div className="flex gap-2 flex-wrap justify-center">
                  {ATTRIBUTE_FIELDS.map((f) => (
                    <span key={f.key} className="text-xs px-2 py-1 rounded bg-stone-800 text-stone-300">{f.abbr}: {attributes[f.key]}</span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleFinish} className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg transition-colors font-semibold text-lg shadow-lg shadow-amber-900/30">
              进入角色卡
            </button>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-6 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 transition-colors text-sm"
          >
            上一步
          </button>

          {currentPage !== "finish" && (
            <button
              onClick={() => {
                if (step === 0 && !className) return;
                if (step === 2 && method === "recommended") {
                  const isDefault = ATTRIBUTE_FIELDS.every((f) => attributes[f.key] === 8);
                  if (isDefault) return;
                }
                // 跳过不需要的页面
                let nextStep = step + 1;
                const nextPage = getPageForStep(nextStep);
                // 如果不需要子职页面，跳过
                if (nextPage === "subclass" && !needsSubclassPage) {
                  nextStep++;
                }
                // 如果不需要法术页面，跳过
                if (nextPage === "spells" && !needsSpellPage) {
                  nextStep++;
                }
                setStep(nextStep);
              }}
              disabled={
                (step === 0 && !className) ||
                (step === 2 && method === "recommended" && ATTRIBUTE_FIELDS.every((f) => attributes[f.key] === 8))
              }
              className="px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-amber-50 transition-colors text-sm font-medium"
            >
              {getPageForStep(step + 1) === "finish" ? "查看摘要" : "下一步"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}