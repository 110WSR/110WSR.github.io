import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCharacter } from "../shared/storage/CharacterContext";
import type { Attributes, Personality, SavingThrows } from "../shared/storage/types";
import type { Item, AttackEntry } from "../shared/types/types";
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
import type { SubclassFeature } from "./creator/SubclassSelectionPanel";
import { ATTRIBUTE_FIELDS, generateRandomAttributes } from "./creator/types";
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

export default function CharacterCreator() {
  const navigate = useNavigate();
  const { newCharacter, setAttributes, setBasicInfo, setLevel, setPersonality, setEquipment, setBackstory, updateCharacter } = useCharacter();

  const [step, setStep] = useState(0);
  const steps = ["基本信息", "选择方法", "确认属性", "生命值与技能", "选择子职", "选择装备", "角色细节", "完成"];

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
    navigate("/sheet");
  }, [charName, className, race, background, level, attributes, currentHP, maxHP, alignment, localPersonality, backstory,
      selectedWeapons, selectedArmor, hasShield, equipmentText, selectedSkills, updateCharacter,
      newCharacter, setAttributes, setBasicInfo, setLevel, setPersonality, setEquipment, setBackstory, navigate,
      selectedSubclass, subclassFeatures]);

  const attributeSummary = useMemo(() => ATTRIBUTE_FIELDS.reduce((sum, f) => sum + attributes[f.key], 0), [attributes]);
  const classId = useMemo(() => findClassId(className), [className]);

  // 计算实际步骤索引（根据是否需要子职页面调整）
  const getActualStep = useCallback((logicalStep: number) => {
    // 逻辑步骤：0=基本信息, 1=选择方法, 2=确认属性, 3=生命值与技能, 4=子职, 5=装备, 6=细节, 7=完成
    // 如果不需要子职页面，则跳过步骤4
    if (!needsSubclassPage && logicalStep >= 4) {
      return logicalStep + 1;
    }
    return logicalStep;
  }, [needsSubclassPage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
      <div className="border-b border-stone-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回主菜单
          </button>
          <div className="text-stone-500 text-sm">创建新角色</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">基本信息</h2>
            <BasicInfoForm name={charName} onNameChange={setCharName} className={className} onClassChange={setClassName} race={race} onRaceChange={setRace} background={background} onBackgroundChange={setBackground} level={level} onLevelChange={setLevelState} />
          </div>
        )}

        {step === 1 && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">选择属性生成方式</h2>
            <MethodSelector method={method} onMethodChange={handleMethodChange} />
          </div>
        )}

        {step === 2 && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">确认属性值</h2>
            <div className="text-stone-500 text-xs mb-4">当前使用方式: {method === "standard" ? "官方购点法" : method === "random" ? "随机生成" : method === "recommended" ? "推荐属性" : "自行填数"}</div>
            {method === "standard" && <PointBuyPanel attributes={attributes} onAttributeChange={handleAttributeChange} />}
            {method === "random" && <RandomRollPanel attributes={attributes} onAttributeChange={handleAttributeChange} onReroll={handleReroll} />}
            {method === "recommended" && <RecommendedPanel onSelectBuild={handleSelectBuild} />}
            {method === "manual" && <ManualInputPanel attributes={attributes} onAttributeChange={handleAttributeChange} />}
            <div className="mt-4 text-center text-stone-500 text-xs">属性总和: {attributeSummary}</div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {/* 投掷生命值 */}
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

            {/* 选择技能 */}
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

        {step === 4 && needsSubclassPage && (
          <SubclassSelectionPanel
            className={className}
            level={level}
            selectedSubclass={selectedSubclass}
            onSubclassChange={handleSubclassChange}
          />
        )}

        {step === 4 && !needsSubclassPage && (
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

        {step === 5 && needsSubclassPage && (
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

        {step === 5 && !needsSubclassPage && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">角色细节</h2>
            <CharacterDetailsPanel
              alignment={alignment} onAlignmentChange={setAlignment}
              personality={localPersonality} onPersonalityChange={setLocalPersonality}
              backstory={backstory} onBackstoryChange={setBackstoryState}
            />
          </div>
        )}

        {step === 6 && needsSubclassPage && (
          <div className="bg-stone-800/30 rounded-lg border border-stone-700/50 p-6">
            <h2 className="text-amber-300 text-lg font-semibold mb-4">角色细节</h2>
            <CharacterDetailsPanel
              alignment={alignment} onAlignmentChange={setAlignment}
              personality={localPersonality} onPersonalityChange={setLocalPersonality}
              backstory={backstory} onBackstoryChange={setBackstoryState}
            />
          </div>
        )}

        {step === 6 && !needsSubclassPage && (
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

        {step === 7 && needsSubclassPage && (
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

          {step < (needsSubclassPage ? 7 : 6) && (
            <button
              onClick={() => {
                if (step === 0 && !className) return;
                if (step === 2 && method === "recommended") {
                  const isDefault = ATTRIBUTE_FIELDS.every((f) => attributes[f.key] === 8);
                  if (isDefault) return;
                }
                // 如果不需要子职页面，跳过步骤4
                if (step === 3 && !needsSubclassPage) {
                  setStep(5);
                  return;
                }
                setStep(step + 1);
              }}
              disabled={
                (step === 0 && !className) ||
                (step === 2 && method === "recommended" && ATTRIBUTE_FIELDS.every((f) => attributes[f.key] === 8))
              }
              className="px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-amber-50 transition-colors text-sm font-medium"
            >
              {step === (needsSubclassPage ? 6 : 5) ? "查看摘要" : "下一步"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}