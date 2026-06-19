// ============================================================================
// 武器名称解析器 - 从武器预设数据中查找匹配的武器并恢复属性
// ============================================================================

import weaponPresets from "../../../data/weaponPresets.json";

interface WeaponPreset {
  id: string;
  label: string;
  damageDice: string;
  damageType: string;
  tags: string[];
  attackAttr: string;
}

const presets = weaponPresets as WeaponPreset[];

/**
 * 根据武器名称查找对应的预设数据
 * 用于从库存移回装备栏时恢复武器属性
 */
export function resolveWeaponByName(name: string): {
  isWeapon: boolean;
  damageDice?: string;
  damageType?: string;
  attackAttr?: string;
  tags?: string[];
} | null {
  // 精确匹配
  const exact = presets.find(p => p.label === name);
  if (exact) {
    return {
      isWeapon: true,
      damageDice: exact.damageDice,
      damageType: exact.damageType,
      attackAttr: exact.attackAttr,
      tags: exact.tags,
    };
  }

  // 模糊匹配（名称包含）
  const fuzzy = presets.find(p =>
    name.includes(p.label) || p.label.includes(name)
  );
  if (fuzzy) {
    return {
      isWeapon: true,
      damageDice: fuzzy.damageDice,
      damageType: fuzzy.damageType,
      attackAttr: fuzzy.attackAttr,
      tags: fuzzy.tags,
    };
  }

  return null;
}