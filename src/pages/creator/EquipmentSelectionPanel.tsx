import { WEAPON_CATEGORIES, ARMOR_OPTIONS } from "./types";

/** 各职业官方起始装备选项（基于5e玩家手册） */
const CLASS_EQUIPMENT: Record<string, {
  weapons: { label: string; options: string[] }[];
  armor: string[];
  shield: boolean;
  description: string;
}> = {
  "野蛮人": {
    weapons: [
      { label: "选择武器A", options: ["巨斧", "巨锤"] },
      { label: "选择武器B", options: ["手斧×2", "标枪×2"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：巨斧或巨锤；两把手斧或两把标枪；探险家套组"
  },
  "吟游诗人": {
    weapons: [
      { label: "选择武器", options: ["长剑", "刺剑", "短剑"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；长剑或刺剑或短剑；匕首；乐器；外交官套组"
  },
  "牧师": {
    weapons: [
      { label: "选择武器", options: ["硬头锤", "战锤"] },
    ],
    armor: ["鳞甲", "链甲衫", "皮甲"],
    shield: true,
    description: "起始装备：鳞甲或链甲衫或皮甲；硬头锤或战锤；盾牌；牧师套组"
  },
  "德鲁伊": {
    weapons: [
      { label: "选择武器", options: ["长棍", "矛", "镰刀", "匕首", "投石索"] },
    ],
    armor: ["皮甲"],
    shield: true,
    description: "起始装备：皮甲；盾牌；长棍或矛或镰刀或匕首或投石索；探索者套组"
  },
  "战士": {
    weapons: [
      { label: "选择武器A", options: ["链甲", "皮甲", "链甲衫"] },
      { label: "选择武器B", options: ["长剑", "巨剑", "巨斧"] },
      { label: "选择武器C", options: ["手弩", "短弓"] },
    ],
    armor: ["链甲", "皮甲", "链甲衫"],
    shield: true,
    description: "起始装备：链甲或皮甲或链甲衫；长剑或巨剑或巨斧；手弩或短弓；盾牌；地城套组"
  },
  "武僧": {
    weapons: [
      { label: "选择武器", options: ["短剑", "长棍"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：短剑或长棍；探索者套组"
  },
  "圣武士": {
    weapons: [
      { label: "选择武器A", options: ["长剑", "巨剑", "战锤"] },
      { label: "选择武器B", options: ["标枪×5", "标枪×2"] },
    ],
    armor: ["链甲", "板条甲"],
    shield: true,
    description: "起始装备：链甲或板条甲；长剑或巨剑或战锤；五把标枪或两把标枪；盾牌；牧师套组"
  },
  "游侠": {
    weapons: [
      { label: "选择武器A", options: ["长剑", "短剑"] },
      { label: "选择武器B", options: ["长弓", "短弓"] },
    ],
    armor: ["鳞甲", "皮甲"],
    shield: false,
    description: "起始装备：鳞甲或皮甲；长剑或短剑；长弓或短弓；探索者套组"
  },
  "游荡者": {
    weapons: [
      { label: "选择武器", options: ["刺剑", "短剑"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；刺剑或短剑；匕首；盗贼套组"
  },
  "术士": {
    weapons: [
      { label: "选择武器", options: ["轻弩", "长棍", "匕首"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：轻弩或长棍或匕首；法师套组"
  },
  "邪术师": {
    weapons: [
      { label: "选择武器", options: ["长剑", "刺剑", "短剑"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；长剑或刺剑或短剑；学者套组"
  },
  "法师": {
    weapons: [
      { label: "选择武器", options: ["长棍", "匕首", "轻弩", "短剑"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：长棍或匕首或轻弩或短剑；法师套组"
  },
  "奇械师": {
    weapons: [
      { label: "选择武器", options: ["轻弩", "长剑", "短剑"] },
    ],
    armor: ["皮甲", "链甲衫"],
    shield: true,
    description: "起始装备：皮甲或链甲衫；轻弩或长剑或短剑；盾牌；工匠套组"
  },
  "血猎手": {
    weapons: [
      { label: "选择武器A", options: ["长剑", "巨剑", "巨斧"] },
      { label: "选择武器B", options: ["手弩", "短弓"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；长剑或巨剑或巨斧；手弩或短弓；地城套组"
  },
};

export default function EquipmentSelectionPanel({ selectedWeapons, onWeaponsChange, selectedArmor, onArmorChange, hasShield, onShieldChange, equipmentText, onEquipmentTextChange, className: propClassName }: {
  selectedWeapons: string[]; onWeaponsChange: (w: string[]) => void; selectedArmor: string; onArmorChange: (a: string) => void; hasShield: boolean; onShieldChange: (s: boolean) => void; equipmentText: string; onEquipmentTextChange: (t: string) => void; className?: string;
}) {
  // 从父组件获取 className（通过 props 传入）
  const classEquipment = propClassName ? CLASS_EQUIPMENT[propClassName] : null;

  const toggleWeapon = (weapon: string) => {
    if (selectedWeapons.includes(weapon)) { onWeaponsChange(selectedWeapons.filter((w) => w !== weapon)); }
    else { onWeaponsChange([...selectedWeapons, weapon]); }
  };

  // 获取可用的武器列表（根据职业或全部）
  const weaponCategories = classEquipment
    ? classEquipment.weapons.map(cat => ({
        label: cat.label,
        options: cat.options.map(w => w.replace(/×\d+$/, "")) // 去掉数量标记
      }))
    : WEAPON_CATEGORIES;

  // 获取可用的护甲列表
  const armorOptions = classEquipment
    ? classEquipment.armor.map(a => ({ label: a, value: a }))
    : ARMOR_OPTIONS;

  return (
    <div className="space-y-6">
      {/* 职业装备提示 */}
      {classEquipment && (
        <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700/50">
          <p className="text-stone-400 text-xs leading-relaxed">{classEquipment.description}</p>
        </div>
      )}

      <div>
        <h3 className="text-amber-300 text-sm font-semibold mb-3">选择武器</h3>
        <div className="space-y-3">
          {weaponCategories.map((cat) => (
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

      <div>
        <h3 className="text-amber-300 text-sm font-semibold mb-3">选择护甲</h3>
        <select value={selectedArmor} onChange={(e) => onArmorChange(e.target.value)} className="w-full max-w-xs px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm appearance-none cursor-pointer">
          <option value="">无护甲</option>
          {armorOptions.map((armor) => <option key={armor.value} value={armor.value}>{armor.label}</option>)}
        </select>
      </div>

      {classEquipment?.shield && (
        <div className="flex items-center gap-3">
          <input type="checkbox" id="shield" checked={hasShield} onChange={(e) => onShieldChange(e.target.checked)} className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-amber-600 focus:ring-amber-600" />
          <label htmlFor="shield" className="text-stone-300 text-sm cursor-pointer">装备盾牌</label>
        </div>
      )}

      <div>
        <h3 className="text-amber-300 text-sm font-semibold mb-3">其他装备/物品</h3>
        <textarea value={equipmentText} onChange={(e) => onEquipmentTextChange(e.target.value)} placeholder="输入其他装备、物品或备注..." rows={3} className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 outline-none focus:border-amber-600/50 transition-colors text-sm resize-none" />
      </div>
    </div>
  );
}
