import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { sheetColors } from "../../shared/tokens/colors";
import { createDefaultItem } from "../../shared/types/types";
import type { Item } from "../../shared/types/types";
import magicItems from "../../../data/magicItems.json";
import adventuringGear from "../../../data/adventuringGear.json";
import weaponPresets from "../../../data/weaponPresets.json";
import ScrollArea from "../../shared/ui/ScrollArea";

const FVAR = "'CTGR' 0, 'wdth' 100";

const T: React.CSSProperties = {
  fontSize: "13px", fontFamily: "var(--font-serif-regular)", color: sheetColors.textDark, fontVariationSettings: FVAR,
};

interface EquipmentLibraryDialogProps {
  open: boolean;
  onSelect: (item: Item) => void;
  onClose: () => void;
}

interface MagicItemEntry {
  cn: string;
  en: string;
}

interface GearEntry {
  name: string;
  fullName: string;
  price: string;
  weight: string;
}

interface WeaponEntry {
  label: string;
  damageDice: string;
  damageType: string;
  tags: string[];
  attackAttr: string;
}

type TabType = "magic" | "gear" | "weapon";

const ALL_MAGIC_ITEMS = magicItems as MagicItemEntry[];
const ALL_GEAR = adventuringGear as GearEntry[];

export function EquipmentLibraryDialog({ open, onSelect, onClose }: EquipmentLibraryDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("magic");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchText("");
      setSelectedCategory("全部");
      setActiveTab("magic");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  // ── 魔法物品分类 ──
  const magicCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("全部");
    for (const item of ALL_MAGIC_ITEMS) {
      const en = item.en;
      if (en.includes("Armor") || en.includes("Shield")) cats.add("护甲");
      else if (en.includes("Weapon") || en.includes("Ammunition") || en.includes("Arrow")) cats.add("武器");
      else if (en.includes("Potion") || en.includes("Elixir") || en.includes("Oil")) cats.add("药水");
      else if (en.includes("Ring")) cats.add("戒指");
      else if (en.includes("Staff") || en.includes("Rod") || en.includes("Wand")) cats.add("法杖/权杖");
      else if (en.includes("Scroll")) cats.add("卷轴");
      else if (en.includes("Wondrous") || en.includes("Bag") || en.includes("Boots") || en.includes("Cloak") || en.includes("Robe") || en.includes("Helm") || en.includes("Amulet") || en.includes("Belt") || en.includes("Gloves") || en.includes("Bracers") || en.includes("Cape") || en.includes("Figurine") || en.includes("Horn") || en.includes("Instrument") || en.includes("Manual") || en.includes("Tome") || en.includes("Stone") || en.includes("Crystal") || en.includes("Gem")) cats.add("奇物");
      else cats.add("其他");
    }
    return Array.from(cats).sort();
  }, []);

  // ── 通用物品分类 ──
  const gearCategories = useMemo(() => {
    return ["全部"];
  }, []);

  // ── 武器分类 ──
  const weaponCategories = useMemo(() => {
    return ["全部", "简易近战", "简易远程", "军用近战", "军用远程"];
  }, []);

  // 判断武器类型
  const getWeaponCategory = (w: WeaponEntry): string => {
    const isRanged = w.tags.some(t => t.includes("弹药") || t.includes("投掷"));
    const isSimple = ["木棍", "匕首", "巨木棍", "手斧", "标枪", "轻锤", "钉头锤", "长棍", "镰刀", "矛", "轻弩", "飞镖", "短弓", "投石索"].includes(w.label);
    const isMartial = !isSimple;
    if (isSimple && !isRanged) return "简易近战";
    if (isSimple && isRanged) return "简易远程";
    if (isMartial && !isRanged) return "军用近战";
    if (isMartial && isRanged) return "军用远程";
    return "其他";
  };

  // ── 过滤 ──
  const filteredMagicItems = useMemo(() => {
    let items = ALL_MAGIC_ITEMS;
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter(item =>
        item.cn.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "全部") {
      items = items.filter(item => {
        const en = item.en;
        switch (selectedCategory) {
          case "护甲": return en.includes("Armor") || en.includes("Shield");
          case "武器": return en.includes("Weapon") || en.includes("Ammunition") || en.includes("Arrow");
          case "药水": return en.includes("Potion") || en.includes("Elixir") || en.includes("Oil");
          case "戒指": return en.includes("Ring");
          case "法杖/权杖": return en.includes("Staff") || en.includes("Rod") || en.includes("Wand");
          case "卷轴": return en.includes("Scroll");
          case "奇物": return en.includes("Wondrous") || en.includes("Bag") || en.includes("Boots") || en.includes("Cloak") || en.includes("Robe") || en.includes("Helm") || en.includes("Amulet") || en.includes("Belt") || en.includes("Gloves") || en.includes("Bracers") || en.includes("Cape") || en.includes("Figurine") || en.includes("Horn") || en.includes("Instrument") || en.includes("Manual") || en.includes("Tome") || en.includes("Stone") || en.includes("Crystal") || en.includes("Gem");
          default: return true;
        }
      });
    }
    return items;
  }, [searchText, selectedCategory]);

  const filteredGear = useMemo(() => {
    let items = ALL_GEAR;
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q)
      );
    }
    return items;
  }, [searchText]);

  const filteredWeapons = useMemo(() => {
    let items = weaponPresets as WeaponEntry[];
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter(item =>
        item.label.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "全部") {
      items = items.filter(item => getWeaponCategory(item) === selectedCategory);
    }
    return items;
  }, [searchText, selectedCategory]);

  // ── 选择处理 ──
  const handleSelectMagic = useCallback((entry: MagicItemEntry) => {
    const item = createDefaultItem(entry.cn);
    item.description = entry.en;
    if (entry.en.includes("Weapon") || entry.en.includes("Ammunition") || entry.en.includes("Arrow")) {
      item.isWeapon = true;
      item.proficient = true;
    }
    onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  const handleSelectGear = useCallback((entry: GearEntry) => {
    const item = createDefaultItem(entry.name);
    item.description = `${entry.fullName} | 价格: ${entry.price} | 重量: ${entry.weight}`;
    onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  const handleSelectWeapon = useCallback((entry: WeaponEntry) => {
    const item = createDefaultItem(entry.label);
    item.isWeapon = true;
    item.proficient = true;
    item.damageDice = entry.damageDice;
    item.damageType = entry.damageType;
    item.description = `伤害: ${entry.damageDice} ${entry.damageType} | 属性: ${entry.attackAttr.toUpperCase()} | 特性: ${entry.tags.join(", ") || "无"}`;
    onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  if (!open) return null;

  const categories = activeTab === "magic" ? magicCategories : activeTab === "gear" ? gearCategories : weaponCategories;
  const totalCount = activeTab === "magic" ? filteredMagicItems.length : activeTab === "gear" ? filteredGear.length : filteredWeapons.length;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(620px, calc(100vw - 32px))", maxHeight: "min(620px, 90vh)", display: "flex", flexDirection: "column",
          backgroundColor: sheetColors.cardBg, borderRadius: "10px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.07)",
          overflow: "hidden", fontVariationSettings: FVAR,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderBottom: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0
        }}>
          <span className="text-base font-semibold" style={{ fontFamily: "var(--font-serif-bold)", color: sheetColors.textPrimary }}>
            装备库检索
          </span>
          <button
            onClick={onClose}
            style={{ ...T, border: "none", background: "transparent", cursor: "pointer", padding: "4px 8px", color: sheetColors.textLighter }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0 }}>
          {[
            { key: "magic" as TabType, label: "魔法物品" },
            { key: "gear" as TabType, label: "通用物品" },
            { key: "weapon" as TabType, label: "武器库" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedCategory("全部"); setSearchText(""); }}
              style={{
                flex: 1, padding: "8px 0", border: "none", cursor: "pointer",
                fontSize: "13px", fontFamily: "var(--font-serif-medium)",
                backgroundColor: activeTab === tab.key ? sheetColors.cardBg : sheetColors.hoverBg,
                color: activeTab === tab.key ? sheetColors.textPrimary : sheetColors.textSecondary,
                borderBottom: activeTab === tab.key ? `2px solid ${sheetColors.accentBlue}` : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Category */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0 }}>
          <input
            ref={searchRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={`搜索${activeTab === "magic" ? "魔法装备" : activeTab === "gear" ? "通用物品" : "武器"}名称...`}
            style={{
              ...T, width: "100%", boxSizing: "border-box",
              border: `1px solid ${sheetColors.borderLight}`, borderRadius: "4px",
              padding: "8px 12px", outline: "none", backgroundColor: sheetColors.pageBg,
              fontSize: "14px",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = sheetColors.borderInput)}
            onBlur={(e) => (e.currentTarget.style.borderColor = sheetColors.borderLight)}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "4px 12px", borderRadius: "12px", border: "none",
                  fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-serif-medium)",
                  backgroundColor: cat === selectedCategory ? sheetColors.buttonDarkBg : sheetColors.hoverBg,
                  color: cat === selectedCategory ? sheetColors.textWhite : sheetColors.textSecondary,
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 6, ...T, fontSize: "11px", color: sheetColors.textPlaceholder }}>
            共 {totalCount} 件{activeTab === "magic" ? "魔法物品" : activeTab === "gear" ? "通用物品" : "武器"}
          </div>
        </div>

        {/* Item List */}
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <div style={{ padding: "8px 16px" }}>
            {totalCount === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", ...T, color: sheetColors.textPlaceholder }}>
                未找到匹配的装备
              </div>
            ) : (
              <>
                {/* 魔法物品列表 */}
                {activeTab === "magic" && filteredMagicItems.map((entry, i) => (
                  <div
                    key={entry.cn + i}
                    onClick={() => handleSelectMagic(entry)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", borderRadius: "4px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderBottom: i < filteredMagicItems.length - 1 ? `1px solid ${sheetColors.hoverBg}` : "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div>
                      <div style={{ ...T, fontSize: "14px", fontWeight: 500 }}>{entry.cn}</div>
                      <div style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder, marginTop: 2 }}>{entry.en}</div>
                    </div>
                    <div style={{ ...T, fontSize: "11px", color: sheetColors.textLighter, whiteSpace: "nowrap" }}>
                      + 添加
                    </div>
                  </div>
                ))}

                {/* 通用物品列表 */}
                {activeTab === "gear" && filteredGear.map((entry, i) => (
                  <div
                    key={entry.name + i}
                    onClick={() => handleSelectGear(entry)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", borderRadius: "4px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderBottom: i < filteredGear.length - 1 ? `1px solid ${sheetColors.hoverBg}` : "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div>
                      <div style={{ ...T, fontSize: "14px", fontWeight: 500 }}>{entry.name}</div>
                      <div style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder, marginTop: 2 }}>
                        {entry.fullName} | {entry.price} | {entry.weight}
                      </div>
                    </div>
                    <div style={{ ...T, fontSize: "11px", color: sheetColors.textLighter, whiteSpace: "nowrap" }}>
                      + 添加
                    </div>
                  </div>
                ))}

                {/* 武器列表 */}
                {activeTab === "weapon" && filteredWeapons.map((entry, i) => (
                  <div
                    key={entry.label + i}
                    onClick={() => handleSelectWeapon(entry)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", borderRadius: "4px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderBottom: i < filteredWeapons.length - 1 ? `1px solid ${sheetColors.hoverBg}` : "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div>
                      <div style={{ ...T, fontSize: "14px", fontWeight: 500 }}>{entry.label}</div>
                      <div style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder, marginTop: 2 }}>
                        {entry.damageDice} {entry.damageType} | {entry.tags.join(", ") || "无特性"}
                      </div>
                    </div>
                    <div style={{ ...T, fontSize: "11px", color: sheetColors.textLighter, whiteSpace: "nowrap" }}>
                      + 添加
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>,
    document.body
  );
}