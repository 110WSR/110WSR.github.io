import { WEAPON_CATEGORIES, ARMOR_OPTIONS } from "./types";

export default function EquipmentSelectionPanel({ selectedWeapons, onWeaponsChange, selectedArmor, onArmorChange, hasShield, onShieldChange, equipmentText, onEquipmentTextChange }: {
  selectedWeapons: string[]; onWeaponsChange: (w: string[]) => void; selectedArmor: string; onArmorChange: (a: string) => void; hasShield: boolean; onShieldChange: (s: boolean) => void; equipmentText: string; onEquipmentTextChange: (t: string) => void;
}) {
  const toggleWeapon = (weapon: string) => {
    if (selectedWeapons.includes(weapon)) { onWeaponsChange(selectedWeapons.filter((w) => w !== weapon)); }
    else { onWeaponsChange([...selectedWeapons, weapon]); }
  };
  return (
    <div className="space-y-6">
      <div><h3 className="text-amber-300 text-sm font-semibold mb-3">选择武器</h3>
        <div className="space-y-3">
          {WEAPON_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <div className="text-stone-400 text-xs mb-2">{cat.label}</div>
              <div className="flex flex-wrap gap-2">
                {cat.options.map((weapon) => (
                  <button key={weapon} onClick={() => toggleWeapon(weapon)} className={"px-3 py-1.5 rounded-md text-xs transition-all duration-200 " + (selectedWeapons.includes(weapon) ? "bg-amber-700/50 text-amber-200 border border-amber-600/50" : "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50")}>{weapon}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div><h3 className="text-amber-300 text-sm font-semibold mb-3">选择护甲</h3>
        <select value={selectedArmor} onChange={(e) => onArmorChange(e.target.value)} className="w-full max-w-xs px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer">
          {ARMOR_OPTIONS.map((armor) => <option key={armor.value} value={armor.value}>{armor.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="shield" checked={hasShield} onChange={(e) => onShieldChange(e.target.checked)} className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-amber-600 focus:ring-amber-600" />
        <label htmlFor="shield" className="text-stone-300 text-sm cursor-pointer">装备盾牌</label>
      </div>
      <div><h3 className="text-amber-300 text-sm font-semibold mb-3">其他装备/物品</h3>
        <textarea value={equipmentText} onChange={(e) => onEquipmentTextChange(e.target.value)} placeholder="输入其他装备、物品或备注..." rows={3} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm resize-none" />
      </div>
    </div>
  );
}