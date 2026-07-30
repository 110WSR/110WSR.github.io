// ============================================================================
// 角色数据上下文 —— 所有页面共享同一份数据
// ============================================================================

import {
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  CharacterData,
  Attributes,
  Proficiencies,
  Coins,
  Personality,
  DeathSaves,
  SpellBoxData,
} from "./types";
import type { Item, AttackEntry } from "../types/types";
import type { CharacterInfoData } from "../../features/back-info/CharacterInfoSection";
import { CharacterContext } from "./characterHooks";
import type { CharacterContextValue } from "./characterHooks";
import {
  getCurrentCharacter,
  getSaveList,
  saveCharacter,
  createCharacter,
  switchCharacter as switchStorageCharacter,
} from "./storageService";

// Context 对象与 useCharacter/useCharacterData 已移至 ./characterHooks
// （本文件只导出 Provider 组件，保证 fast refresh 生效）

// ============================================================================
// Provider
// ============================================================================

export function CharacterProvider({ children }: { children: ReactNode }) {
  // 首次加载时，如果无存档则自动创建默认角色
  const [character, setCharacterState] = useState<CharacterData | null>(() => {
    const existing = getCurrentCharacter();
    if (existing) return existing;
    // 无存档 → 自动创建一个
    const fresh = createCharacter("新角色");
    return fresh;
  });
  const [saveList, setSaveList] = useState<
    { id: string; name: string; updatedAt: number }[]
  >(() => getSaveList());
  const [currentId, setCurrentId] = useState<string | null>(
    () => getCurrentCharacter()?.id ?? null
  );

  // ========================================================================
  // 核心：更新角色数据并自动保存
  // ========================================================================

  const updateCharacter = useCallback((patch: Partial<CharacterData>) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch, updatedAt: Date.now() };
      // 异步写入 localStorage，不阻塞 UI 渲染
      setTimeout(() => saveCharacter(next), 0);
      return next;
    });
  }, []);

  const setCharacter = useCallback((data: CharacterData) => {
    setCharacterState(data);
    setCurrentId(data.id);
    setTimeout(() => saveCharacter(data), 0);
  }, []);

  // ========================================================================
  // 细分更新方法
  // ========================================================================

  const setAttributes = useCallback(
    (attrs: Attributes) => updateCharacter({ attributes: attrs }),
    [updateCharacter]
  );
  const setLevel = useCallback(
    (level: number | "") => updateCharacter({ level }),
    [updateCharacter]
  );
  const setProficiencyBonus = useCallback(
    (proficiencyBonus: number) => updateCharacter({ proficiencyBonus }),
    [updateCharacter]
  );
  const setBasicInfo = useCallback(
    (basicInfo: Record<string, string>) => updateCharacter({ basicInfo }),
    [updateCharacter]
  );
  const setPersonality = useCallback(
    (personality: Personality) => updateCharacter({ personality }),
    [updateCharacter]
  );
  const setCoins = useCallback(
    (coins: Coins) => updateCharacter({ coins }),
    [updateCharacter]
  );
  const setEquipment = useCallback(
    (equipment: string) => updateCharacter({ equipment }),
    [updateCharacter]
  );
  const setTraits = useCallback(
    (traits: string) => updateCharacter({ traits }),
    [updateCharacter]
  );
  const setWeapons = useCallback(
    (weapons: never[]) => updateCharacter({ weapons }),
    [updateCharacter]
  );
  const setProficiencies = useCallback(
    (proficiencies: Proficiencies) => updateCharacter({ proficiencies }),
    [updateCharacter]
  );
  const setDeathSaves = useCallback(
    (deathSaves: DeathSaves) => updateCharacter({ deathSaves }),
    [updateCharacter]
  );
  const setCharacterInfo = useCallback(
    (characterInfo: CharacterInfoData) => updateCharacter({ characterInfo }),
    [updateCharacter]
  );
  const setBackstory = useCallback(
    (backstory: string) => updateCharacter({ backstory }),
    [updateCharacter]
  );
  const setInventory = useCallback(
    (inventory: string) => updateCharacter({ inventory }),
    [updateCharacter]
  );
  const setAdventureLog = useCallback(
    (adventureLog: string) => updateCharacter({ adventureLog }),
    [updateCharacter]
  );
  const setDate = useCallback(
    (date: string) => updateCharacter({ date }),
    [updateCharacter]
  );
  const setSpellBoxes = useCallback(
    (spellBoxes: SpellBoxData[]) => updateCharacter({ spellBoxes }),
    [updateCharacter]
  );
  const setCustomHeights = useCallback(
    (customHeights: Record<number, number>) => updateCharacter({ customHeights }),
    [updateCharacter]
  );

  const setItems = useCallback(
    (items: Item[]) => updateCharacter({ items }),
    [updateCharacter]
  );
  const setAttackEntries = useCallback(
    (attackEntries: AttackEntry[]) => updateCharacter({ attackEntries }),
    [updateCharacter]
  );
  const setSpellcastingAbility = useCallback(
    (spellcastingAbility: "int" | "wis" | "cha") => updateCharacter({ spellcastingAbility }),
    [updateCharacter]
  );

  // ========================================================================
  // 存档管理
  // ========================================================================

  const refreshSaveList = useCallback(() => {
    setSaveList(getSaveList());
  }, []);

  const switchCharacterFn = useCallback(
    (id: string) => {
      const char = switchStorageCharacter(id);
      if (char) {
        setCharacterState(char);
        setCurrentId(id);
        refreshSaveList();
      }
    },
    [refreshSaveList]
  );

  const newCharacter = useCallback(
    (name?: string) => {
      const char = createCharacter(name);
      setCharacterState(char);
      setCurrentId(char.id);
      refreshSaveList();
    },
    [refreshSaveList]
  );

  // saveList 已在 useState 惰性初始化时通过 getSaveList() 读取，
  // 无需挂载后再次同步刷新
  const value: CharacterContextValue = {
    character,
    saveList,
    currentId,
    setCharacter,
    updateCharacter,
    setAttributes,
    setLevel,
    setProficiencyBonus,
    setBasicInfo,
    setPersonality,
    setCoins,
    setEquipment,
    setTraits,
    setWeapons,
    setProficiencies,
    setDeathSaves,
    setCharacterInfo,
    setBackstory,
    setInventory,
    setAdventureLog,
    setDate,
    setItems,
    setAttackEntries,
    setSpellcastingAbility,
    setSpellBoxes,
    setCustomHeights,
    switchCharacter: switchCharacterFn,
    newCharacter,
    refreshSaveList,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}
