import React, { useState, useLayoutEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { sheetColors } from "../../shared/tokens/colors";
import type { TraitItem } from "../../shared/types/types";
import traitKeywords from "../../../data/traitKeywords.json";
import { getTraitRuleInfo } from "../../shared/utils/rulesService";

const KEYWORD_PATTERNS = traitKeywords as string[];
const HIGHLIGHT_RE = new RegExp(`(${KEYWORD_PATTERNS.join('|')})`, 'g');

const FVAR = "'CTGR' 0, 'wdth' 100";
const TOOLTIP_W = 220;
const tooltipBase: React.CSSProperties = {
  position: "fixed", width: TOOLTIP_W,
  backgroundColor: sheetColors.cardBg, borderRadius: "8px",
  border: "1px solid var(--color-border)",
  boxShadow: "0 6px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
  padding: "10px 12px", zIndex: 10000, fontVariationSettings: FVAR,
  pointerEvents: "auto",
};

interface TraitTooltipProps {
  trait: TraitItem | null;
  mouseY: number;
  cardLeft: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const TraitTooltip = React.memo(function TraitTooltip({
  trait, mouseY: initY, cardLeft: initLeft,
  onMouseEnter, onMouseLeave,
}: TraitTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    setPos({
      left: Math.max(4, initLeft - TOOLTIP_W - 8),
      top: Math.max(4, Math.min(initY, window.innerHeight - 200)),
    });
  }, [initY, initLeft]);

  const visible = trait && (!!trait.description || !!trait.name);
  if (!visible) return ReactDOM.createPortal(<div style={{ ...tooltipBase, left: pos.left, top: pos.top, display: "none" }} />, document.body);

  // 规则库描述（玩家未填写自定义描述时自动展示）
  const ruleInfos = trait!.description ? [] : getTraitRuleInfo(trait!.name);
  const ruleText = ruleInfos.map((r) => r.text).join("\n\n————\n\n");
  const ruleSource = ruleInfos.length > 0 ? ruleInfos[0].source : "";

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      style={{ ...tooltipBase, left: pos.left, top: pos.top, maxHeight: "60vh", overflowY: "auto" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 特质名称 */}
      <div style={{ fontSize: "14px", fontFamily: "var(--font-serif-regular)", color: sheetColors.textDark, fontVariationSettings: FVAR, fontWeight: 600, marginBottom: 4 }}>
        {trait!.name}
      </div>
      {/* 标签 */}
      {trait!.tags && trait!.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
          {trait!.tags.map((tag, idx) => (
            <span key={idx} style={{ padding: "1px 6px", borderRadius: "2px", backgroundColor: sheetColors.hoverBg, fontSize: "11px", color: sheetColors.textDark, fontFamily: "var(--font-serif-regular)" }}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {/* 自定义描述或规则库描述 */}
      {(trait!.description || ruleText) && (
        <div style={{ fontSize: "12px", lineHeight: 1.5, whiteSpace: "pre-wrap", color: sheetColors.textLighter, fontFamily: "var(--font-serif-regular)", fontVariationSettings: FVAR }}>
          {(trait!.description || ruleText).split(HIGHLIGHT_RE).map((part, i) =>
            i % 2 === 1
              ? <span key={i} style={{ color: sheetColors.textDark, fontWeight: 600 }}>{part}</span>
              : <span key={i}>{part}</span>
          )}
        </div>
      )}
      {/* 规则出处 */}
      {!trait!.description && ruleSource && (
        <div style={{ fontSize: "10px", color: sheetColors.textLighter, marginTop: 6, fontFamily: "var(--font-serif-regular)", opacity: 0.8 }}>
          规则出处：{ruleSource}{ruleInfos.length > 1 ? ` 等${ruleInfos.length}处` : ""}
        </div>
      )}
    </div>,
    document.body
  );
},
(prevProps, nextProps) =>
  prevProps.trait?.id === nextProps.trait?.id &&
  prevProps.trait?.name === nextProps.trait?.name &&
  prevProps.trait?.description === nextProps.trait?.description &&
  prevProps.trait?.tags === nextProps.trait?.tags &&
  prevProps.mouseY === nextProps.mouseY &&
  prevProps.cardLeft === nextProps.cardLeft);
