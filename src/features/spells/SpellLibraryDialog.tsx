import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { sheetColors } from "../../shared/tokens/colors";
import ScrollArea from "../../shared/ui/ScrollArea";
import spellData from "../../../data/spellData.json";
import type { SpellData } from "../../shared/types/types";
import { getSpellDetailByName, createSpellDataFromDetail } from "../../shared/utils/spellDetailsResolver";

const FVAR = "'CTGR' 0, 'wdth' 100";

const T: React.CSSProperties = {
  fontSize: "13px", fontFamily: "var(--font-serif-regular)", color: sheetColors.textDark, fontVariationSettings: FVAR,
};

interface SpellLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (spell: SpellData) => void;
  /** 当前角色的职业（用于显示本职业法术表） */
  characterClass?: string;
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

/** 中文职业名到spellData中key的映射 */
const CLASS_NAME_MAP: Record<string, string> = {
  "野蛮人": "野蛮人",
  "吟游诗人": "吟游诗人",
  "牧师": "牧师",
  "德鲁伊": "德鲁伊",
  "战士": "战士",
  "武僧": "武僧",
  "圣武士": "圣武士",
  "游侠": "游侠",
  "游荡者": "游荡者",
  "术士": "术士",
  "邪术师": "邪术师",
  "法师": "法师",
  "奇械师": "奇械师",
  "血猎手": "血猎手",
};

export default function SpellLibraryDialog({
  open, onClose, onSelect, characterClass,
}: SpellLibraryDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showClassOnly, setShowClassOnly] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<{ name: string; level: number } | null>(null);

  // 获取本职业法术列表
  const classSpells = useMemo(() => {
    if (!characterClass) return null;
    const classKey = CLASS_NAME_MAP[characterClass] || characterClass;
    const data = (spellData as Record<string, Record<string, string[]>>)[classKey];
    if (!data) return null;
    
    const result: { name: string; level: number }[] = [];
    for (const levelKey of Object.keys(data)) {
      const level = levelKey === "0" ? 0 : parseInt(levelKey);
      const spells = data[levelKey];
      for (const spellName of spells) {
        result.push({ name: spellName, level });
      }
    }
    return result;
  }, [characterClass]);

  const classSpellNames = useMemo(() => {
    if (!classSpells) return new Set<string>();
    return new Set(classSpells.map(s => s.name));
  }, [classSpells]);

  const filteredSpells = useMemo(() => {
    let result = ALL_SPELLS;

    if (showClassOnly && classSpellNames.size > 0) {
      result = result.filter(s => classSpellNames.has(s.name));
    }

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
  }, [searchText, filterLevel, showClassOnly, classSpellNames]);

  const handleSelect = (spellName: string, level: number) => {
    // 尝试从 spellDetails.json 中获取详细信息
    const detail = getSpellDetailByName(spellName);
    let spell: SpellData;
    
    if (detail) {
      spell = createSpellDataFromDetail(detail);
    } else {
      spell = {
        id: `spell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: spellName,
        description: "",
        isInnate: false,
        prepared: level > 0,
        ritual: false,
        concentration: false,
        school: "abjuration",
      };
    }
    onSelect(spell);
    onClose();
  };

  const handleSpellClick = (spell: { name: string; level: number }) => {
    if (selectedSpell?.name === spell.name && selectedSpell?.level === spell.level) {
      // 双击确认选择
      handleSelect(spell.name, spell.level);
    } else {
      setSelectedSpell(spell);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedSpell) {
      handleSelect(selectedSpell.name, selectedSpell.level);
    }
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
          width: "min(640px, calc(100vw - 32px))", maxHeight: "min(700px, 90vh)", display: "flex", flexDirection: "column",
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
          {/* 筛选选项 */}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* 环阶筛选 */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
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
            {/* 本职业法术筛选 */}
            {characterClass && (
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", marginLeft: "auto", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={showClassOnly}
                  onChange={(e) => setShowClassOnly(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ ...T, fontSize: "12px", color: sheetColors.textMedium }}>
                  仅显示{characterClass}法术
                </span>
              </label>
            )}
          </div>
        </div>

        {/* 法术列表 + 详情预览 */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* 左侧列表 */}
          <div style={{ width: selectedSpell ? "50%" : "100%", display: "flex", flexDirection: "column", borderRight: selectedSpell ? `1px solid ${sheetColors.hoverBg}` : "none" }}>
            <ScrollArea style={{ flex: 1, minHeight: 0 }}>
              <div style={{ padding: "8px 16px" }}>
                {filteredSpells.length === 0 ? (
                  <div style={{ ...T, color: sheetColors.textPlaceholder, textAlign: "center", padding: "20px 0" }}>
                    未找到匹配的法术
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {filteredSpells.map((spell, index) => {
                      const isSelected = selectedSpell?.name === spell.name && selectedSpell?.level === spell.level;
                      const isClassSpell = classSpellNames.has(spell.name);
                      return (
                        <div
                          key={`${spell.name}-${index}`}
                          onClick={() => handleSpellClick(spell)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "6px 10px", borderRadius: "2px", cursor: "pointer",
                            backgroundColor: isSelected ? sheetColors.hoverBg : "transparent",
                            borderLeft: isSelected ? `3px solid ${sheetColors.buttonDarkBg}` : "3px solid transparent",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ ...T, fontSize: "13px" }}>{spell.name}</span>
                            {isClassSpell && (
                              <span style={{ fontSize: "9px", padding: "1px 4px", borderRadius: "2px", backgroundColor: "#d4a57420", color: "#d4a574" }}>
                                本职业
                              </span>
                            )}
                          </span>
                          <span style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder }}>
                            {LEVEL_LABELS[spell.level]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 右侧详情预览 */}
          {selectedSpell && (() => {
            const detail = getSpellDetailByName(selectedSpell.name);
            return (
              <div style={{ width: "50%", display: "flex", flexDirection: "column" }}>
                <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                  <div style={{ padding: "12px 16px" }}>
                    <h3 style={{ ...T, fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
                      {selectedSpell.name}
                    </h3>
                    <div style={{ ...T, fontSize: "12px", color: sheetColors.textPlaceholder, marginBottom: "12px" }}>
                      {LEVEL_LABELS[selectedSpell.level]}
                      {classSpellNames.has(selectedSpell.name) && characterClass && (
                        <span style={{ marginLeft: "8px", color: "#d4a574" }}>
                          · {characterClass}法术
                        </span>
                      )}
                    </div>
                    
                    {detail ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {/* 环阶与学派 */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 2,
                            padding: "1px 6px", borderRadius: "2px",
                            backgroundColor: sheetColors.hoverBg, color: sheetColors.textDark,
                            fontSize: "11px", fontFamily: "var(--font-serif-regular)", lineHeight: 1.4,
                          }}>
                            {detail["环阶与学派"]}
                          </span>
                        </div>
                        
                        {/* 法术元信息 */}
                        <div style={{ ...T, fontSize: "11px", color: sheetColors.textMedium, lineHeight: 1.8 }}>
                          <div><span style={{ color: sheetColors.textPlaceholder }}>施法时间：</span>{detail["施法时间"]}</div>
                          <div><span style={{ color: sheetColors.textPlaceholder }}>施法距离：</span>{detail["施法距离"]}</div>
                          <div><span style={{ color: sheetColors.textPlaceholder }}>法术成分：</span>{detail["法术成分"]}</div>
                          <div><span style={{ color: sheetColors.textPlaceholder }}>持续时间：</span>{detail["持续时间"]}</div>
                        </div>
                        
                        {/* 分隔线 */}
                        <div style={{ height: 1, backgroundColor: sheetColors.hoverBg }} />
                        
                        {/* 描述 */}
                        <div style={{ ...T, fontSize: "12px", color: sheetColors.textLighter, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {detail["描述"]}
                        </div>
                      </div>
                    ) : (
                      <div style={{ ...T, fontSize: "12px", color: sheetColors.textLighter, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        点击"选择此法术"按钮将其添加到角色卡。
                        添加后可在法术编辑对话框中填写详细描述。
                      </div>
                    )}
                    
                    <button
                      onClick={handleConfirmSelect}
                      style={{
                        marginTop: "16px", width: "100%", padding: "8px 16px",
                        border: `1px solid ${sheetColors.buttonDarkBg}`, borderRadius: "2px",
                        fontFamily: "var(--font-serif-medium)", fontSize: "13px",
                        backgroundColor: sheetColors.buttonDarkBg, color: sheetColors.textWhite,
                        cursor: "pointer", transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = sheetColors.buttonDarkHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = sheetColors.buttonDarkBg)}
                    >
                      选择此法术
                    </button>
                  </div>
                </ScrollArea>
              </div>
            );
          })()}
        </div>

        {/* 底部统计 */}
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${sheetColors.hoverBg}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder }}>
            共 {filteredSpells.length} 个法术
            {searchText.trim() && `（搜索: "${searchText.trim()}"）`}
            {showClassOnly && characterClass && ` | 仅显示${characterClass}法术`}
          </span>
          {selectedSpell && (
            <span style={{ ...T, fontSize: "11px", color: sheetColors.textPlaceholder }}>
              点击法术查看详情，再次点击或点"选择此法术"确认
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}