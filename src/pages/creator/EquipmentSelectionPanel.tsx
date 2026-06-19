import { WEAPON_CATEGORIES, ARMOR_OPTIONS } from "./types";

/** 各职业官方起始装备选项（基于5e玩家手册5e6.txt） */
const CLASS_EQUIPMENT: Record<string, {
  weapons: { label: string; options: string[] }[];
  armor: string[];
  shield: boolean;
  description: string;
  extraItems: string[];
}> = {
  "野蛮人": {
    weapons: [
      { label: "选择武器A", options: ["巨斧", "任意军用近战武器"] },
      { label: "选择武器B", options: ["手斧×2", "任意简易武器"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：巨斧或任意军用近战武器；两把手斧或任意简易武器；探索者套组和四支标枪",
    extraItems: ["探索者套组", "标枪×4"]
  },
  "吟游诗人": {
    weapons: [
      { label: "选择武器", options: ["刺剑", "长剑", "任意简易武器"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；刺剑或长剑或任意简易武器；大使套组或艺人套组；鲁特琴或其他乐器；匕首",
    extraItems: ["大使套组", "艺人套组", "乐器", "匕首"]
  },
  "牧师": {
    weapons: [
      { label: "选择武器", options: ["硬头锤", "战锤"] },
      { label: "选择远程武器", options: ["轻弩+20支弩矢", "任意简易武器"] },
    ],
    armor: ["鳞甲", "皮甲", "链甲"],
    shield: true,
    description: "起始装备：鳞甲或皮甲或链甲；硬头锤或战锤；轻弩+20支弩矢或任意简易武器；祭司套组或探索者套组；盾牌和圣徽",
    extraItems: ["祭司套组", "探索者套组", "圣徽"]
  },
  "德鲁伊": {
    weapons: [
      { label: "选择武器A", options: ["木盾", "任意简易武器"] },
      { label: "选择武器B", options: ["弯刀", "任意简易近战武器"] },
    ],
    armor: ["皮甲"],
    shield: true,
    description: "起始装备：皮甲；木盾或任意简易武器；弯刀或任意简易近战武器；探索者套组和德鲁伊法器",
    extraItems: ["探索者套组", "德鲁伊法器"]
  },
  "战士": {
    weapons: [
      { label: "选择护甲", options: ["链甲", "皮甲+长弓+20支箭"] },
      { label: "选择武器A", options: ["军用武器+盾牌", "两把军用武器"] },
      { label: "选择武器B", options: ["轻弩+20支弩矢", "手斧×2"] },
    ],
    armor: ["链甲", "皮甲"],
    shield: true,
    description: "起始装备：链甲或皮甲+长弓+20支箭；军用武器+盾牌或两把军用武器；轻弩+20支弩矢或两把手斧；地城套组或探索者套组",
    extraItems: ["地城套组", "探索者套组"]
  },
  "武僧": {
    weapons: [
      { label: "选择武器", options: ["短剑", "任意简易武器"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：短剑或任意简易武器；地城套组或探索者套组；10支飞镖",
    extraItems: ["地城套组", "探索者套组", "飞镖×10"]
  },
  "圣武士": {
    weapons: [
      { label: "选择武器A", options: ["军用武器+盾牌", "两把军用武器"] },
      { label: "选择武器B", options: ["标枪×5", "任意简易近战武器"] },
    ],
    armor: ["链甲"],
    shield: true,
    description: "起始装备：链甲；军用武器+盾牌或两把军用武器；五支标枪或任意简易近战武器；祭司套组或探索者套组；圣徽",
    extraItems: ["祭司套组", "探索者套组", "圣徽"]
  },
  "游侠": {
    weapons: [
      { label: "选择武器A", options: ["短剑×2", "任意简易武器×2"] },
    ],
    armor: ["鳞甲", "皮甲"],
    shield: false,
    description: "起始装备：鳞甲或皮甲；两把短剑或任意两把简易武器；地城套组或探索者套组；长弓和20支箭",
    extraItems: ["地城套组", "探索者套组", "长弓", "箭×20"]
  },
  "游荡者": {
    weapons: [
      { label: "选择武器", options: ["刺剑", "短剑"] },
      { label: "选择远程武器", options: ["短弓+20支箭", "短剑"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；刺剑或短剑；短弓+20支箭或短剑；窃贼套组或地城套组或探索者套组；两把匕首和盗贼工具",
    extraItems: ["窃贼套组", "地城套组", "探索者套组", "匕首×2", "盗贼工具"]
  },
  "术士": {
    weapons: [
      { label: "选择武器", options: ["轻弩+20支弩矢", "任意简易武器"] },
      { label: "选择法器", options: ["材料包", "奥术法器"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：轻弩+20支弩矢或任意简易武器；材料包或奥术法器；地城套组或探索者套组；两把匕首",
    extraItems: ["地城套组", "探索者套组", "匕首×2"]
  },
  "邪术师": {
    weapons: [
      { label: "选择武器", options: ["轻弩+20支弩矢", "任意简易武器"] },
      { label: "选择法器", options: ["材料包", "奥术法器"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；轻弩+20支弩矢或任意简易武器；材料包或奥术法器；学者套组或地城套组；任意简易武器和两把匕首",
    extraItems: ["学者套组", "地城套组", "匕首×2"]
  },
  "法师": {
    weapons: [
      { label: "选择武器", options: ["长棍", "匕首"] },
      { label: "选择法器", options: ["材料包", "奥术法器"] },
    ],
    armor: ["无护甲"],
    shield: false,
    description: "起始装备：长棍或匕首；材料包或奥术法器；学者套组或探索者套组；法术书",
    extraItems: ["学者套组", "探索者套组", "法术书"]
  },
  "奇械师": {
    weapons: [
      { label: "选择武器", options: ["轻弩", "长剑", "短剑"] },
    ],
    armor: ["皮甲", "链甲衫"],
    shield: true,
    description: "起始装备：皮甲或链甲衫；轻弩或长剑或短剑；盾牌；工匠套组",
    extraItems: ["工匠套组"]
  },
  "血猎手": {
    weapons: [
      { label: "选择武器A", options: ["长剑", "巨剑", "巨斧"] },
      { label: "选择武器B", options: ["手弩", "短弓"] },
    ],
    armor: ["皮甲"],
    shield: false,
    description: "起始装备：皮甲；长剑或巨剑或巨斧；手弩或短弓；地城套组",
    extraItems: ["地城套组"]
  },
};

export default function EquipmentSelectionPanel({ selectedWeapons, onWeaponsChange, selectedArmor, onArmorChange, hasShield, onShieldChange, equipmentText, onEquipmentTextChange, className: propClassName }: {
  selectedWeapons: string[]; onWeaponsChange: (w: string[]) => void; selectedArmor: string; onArmorChange: (a: string) => void; hasShield: boolean; onShieldChange: (s: boolean) => void; equipmentText: string; onEquipmentTextChange: (t: string) => void; className?: string;
}) {
  const classEquipment = propClassName ? CLASS_EQUIPMENT[propClassName] : null;

  const toggleWeapon = (weapon: string) => {
    if (selectedWeapons.includes(weapon)) { onWeaponsChange(selectedWeapons.filter((w) => w !== weapon)); }
    else { onWeaponsChange([...selectedWeapons, weapon]); }
  };

  // 获取可用的武器列表（根据职业或全部）
  const weaponCategories = classEquipment
    ? classEquipment.weapons.map(cat => ({
        label: cat.label,
        options: cat.options.map(w => w.replace(/×\d+$/, "").replace(/\+.*$/, "").trim()) // 去掉数量标记和附加说明
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