import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { sheetColors } from "../../shared/tokens/colors";
import ScrollArea from "../../shared/ui/ScrollArea";
import spellData from "../../../data/spellData.json";
import type { SpellData } from "../../shared/types/types";

const FVAR = "'CTGR' 0, 'wdth' 100";

const T: React.CSSProperties = {
  fontSize: "13px", fontFamily: "var(--font-serif-regular)", color: sheetColors.textDark, fontVariationSettings: FVAR,
};

interface SpellLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (spell: SpellData) => void;
}

/** 所有职业的法术列表（去重） */
function getAllSpells(): { name: string; level: number }[] {
  const data = spellData as Record<string, Record<string, string[]>>;
  const seen = new Set<string>();
  const result: { name: string; level: number }[] = [];

  for (const className of Object.keys(data)) {
    const classSpells = data[className];
    for (const levelKey of Object.keys(classSpells)) {
      const level = levelKey === "0" ? 0 : parseInt(levelKey);
      const spells = classSpells[levelKey];
      for (const spellName of spells) {
        if (!seen.has(spellName)) {
          seen.add(spellName);
          result.push({ name: spellName, level });
        }
      }
    }
  }

  return result;
}

const ALL_SPELLS = getAllSpells();

/** 法术环阶标签 */
const LEVEL_LABELS: Record<number, string> = {
  0: "戏法", 1: "1环", 2: "2环", 3: "3环", 4: "4环",
  5: "5环", 6: "6环", 7: "7环", 8: "8环", 9: "9环",
};

export default function SpellLibraryDialog({
  open, onClose, onSelect,
}: SpellLibraryDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  const filteredSpells = useMemo(() => {
    let result = ALL_SPELLS;

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }

    if (filterLevel !== null) {
      result = result.filter(s => s.level === filterLevel);
    }

    // 按环阶排序
    result.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    return result;
  }, [searchText, filterLevel]);

  const handleSelect = (spellName: string, level: number) => {
    const spell: SpellData = {
      id: `spell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: spellName,
      description: "",
      isInnate: false,
      prepared: level > 0,
      ritual: false,
      concentration: false,
    };
    onSelect(spell);
    onClose();
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(520px, calc(100vw - 32px))", maxHeight: "min(600px, 90vh)", display: "flex", flexDirection: "column",
          backgroundColor: sheetColors.cardBg, borderRadius: "10px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.07)",
          overflow: "hidden", fontVariationSettings: FVAR,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0 }}>
          <span className="text-base font-semibold" style={{ fontFamily: "var(--font-serif-bold)", color: sheetColors.textPrimary }}>
            法术库
          </span>
          <button
            onClick={onClose}
            style={{ padding: "4px 12px", border: "1px solid var(--color-border)", borderRadius: "2px", fontFamily: "var(--font-serif-medium)", fontSize: "13px", backgroundColor: sheetColors.cardBg, color: sheetColors.textDark, cursor: "pointer" }}
          >
            关闭
          </button>
        </div>

        {/* 搜索栏 */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索法术名称..."
              style={{
                ...T, flex: 1, boxSizing: "border-box",
                border: "1px solid var(--color-border)", borderRadius: "2px",
                padding: "6px 10px", outline: "none", backgroundColor: sheetColors.cardBg,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = sheetColors.borderInput)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              autoFocus
            />
          </div>
          {/* 环阶筛选 */}
          <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterLevel(null)}
              style={{
                padding: "2px 8px", borderRadius: "2px", fontSize: "11px",
                fontFamily: "var(--font-serif-regular)", cursor: "pointer",
                border: `1px solid ${filterLevel === null ? sheetColors.buttonDarkBg : "var(--color-border)"}`,
                backgroundColor: filterLevel === null ? sheetColors.buttonDarkBg : "transparent",
                color: filterLevel === null ? sheetColors.textWhite : sheetColors.textDark,
              }}
            >
              全部
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
                style={{
                  padding: "2px 8px", borderRadius: "2px", fontSize: "11px",
                  fontFamily: "var(--font-serif-regular)", cursor: "pointer",
                  border: `1px solid ${filterLevel === lvl ? sheetColors.buttonDarkBg : "var(--color-border)"}`,
                  backgroundColor: filterLevel === lvl ? sheetColors.buttonDarkBg : "transparent",
                  color: filterLevel === lvl ? sheetColors.textWhite : sheetColors.textDark,
                }}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
        </div>

        {/* 法术列表 */}
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <div style={{ padding: "8px 16px" }}>
            {filteredSpells.length === 0 ? (
              <div style={{ ...T, color: sheetColors.textPlaceholder, textAlign: "center", padding: "20px 0" }}>
                未找到匹配的法术
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filteredSpells.map((spell, index) => (
                  <div
                    key={`${spell.name}-${index}`}
                    onClick={() => handleSelect(spell.name, spell.level)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 10px", borderRadius: "2px", cursor: "pointer",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = sheetColors.hoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span style={{ ...T, fontSize: "13px" }}>{spell.name}</span>
                    <span style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder }}>
                      {LEVEL_LABELS[spell.level]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 底部统计 */}
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0 }}>
          <span style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder }}>
            共 {filteredSpells.length} 个法术
            {searchText.trim() && `（搜索: "${searchText.trim()}"）`}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}