// ============================================================================
// 角色数据 Context 对象与 Hook —— 与 Provider 组件分离，保证 fast refresh 生效
// ============================================================================

import { createContext, useContext } from "react";
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

// ============================================================================
// Context 类型
// ============================================================================

export interface CharacterContextValue {
  /** 当前角色数据（可能为 null，表示无存档） */
  character: CharacterData | null;

  /** 存档列表 */
  saveList: { id: string; name: string; updatedAt: number }[];

  /** 当前存档 ID */
  currentId: string | null;

  // ---- 通用更新 ----
  /** 直接替换整个 character 对象（慎用） */
  setCharacter: (data: CharacterData) => void;

  /** 深层合并更新（自动调 saveCharacter） */
  updateCharacter: (patch: Partial<CharacterData>) => void;

  // ---- 细分更新（提供便捷 API） ----
  setAttributes: (attrs: Attributes) => void;
  setLevel: (level: number | "") => void;
  setProficiencyBonus: (bonus: number) => void;
  setBasicInfo: (info: Record<string, string>) => void;
  setPersonality: (p: Personality) => void;
  setCoins: (coins: Coins) => void;
  setEquipment: (text: string) => void;
  setTraits: (text: string) => void;
  setWeapons: (weapons: never[]) => void;
  setProficiencies: (p: Proficiencies) => void;
  setDeathSaves: (d: DeathSaves) => void;
  setCharacterInfo: (info: CharacterInfoData) => void;
  setBackstory: (text: string) => void;
  setInventory: (text: string) => void;
  setAdventureLog: (text: string) => void;
  setDate: (date: string) => void;
  setItems: (items: Item[]) => void;
  setAttackEntries: (entries: AttackEntry[]) => void;
  setSpellcastingAbility: (ability: "int" | "wis" | "cha") => void;
  setSpellBoxes: (boxes: SpellBoxData[]) => void;
  setCustomHeights: (heights: Record<number, number>) => void;

  // ---- 存档管理 ----
  switchCharacter: (id: string) => void;
  newCharacter: (name?: string) => void;
  refreshSaveList: () => void;
}

export const CharacterContext = createContext<CharacterContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return ctx;
}

/** 便捷 hook —— 获取当前角色数据（非 null 版本，用于已确定有角色的场景） */
export function useCharacterData(): CharacterData {
  const { character } = useCharacter();
  if (!character) {
    // 如果没有角色，抛出一个可捕获的错误
    throw new Error("No character data available");
  }
  return character;
}
