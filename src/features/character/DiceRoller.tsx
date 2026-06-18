import { useState, useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

// ============================================================================
// 悬浮掷骰器 - 小巧的骰子工具
// ============================================================================

interface DiceRollerProps {
  onClose: () => void;
}

interface DiceType {
  id: string;
  label: string;
  sides: number;
  color: string;
}

const DICE_TYPES: DiceType[] = [
  { id: "d4", label: "d4", sides: 4, color: "#10b981" },
  { id: "d6", label: "d6", sides: 6, color: "#3b82f6" },
  { id: "d8", label: "d8", sides: 8, color: "#8b5cf6" },
  { id: "d10", label: "d10", sides: 10, color: "#f59e0b" },
  { id: "d12", label: "d12", sides: 12, color: "#ef4444" },
  { id: "d20", label: "d20", sides: 20, color: "#ec4899" },
  { id: "d100", label: "d100", sides: 100, color: "#14b8a6" },
];

export default function DiceRoller({ onClose }: DiceRollerProps) {
  const [counts, setCounts] = useState<Record<string, number>>({
    d4: 1, d6: 1, d8: 1, d10: 1, d12: 1, d20: 1, d100: 1,
  });
  const [results, setResults] = useState<Record<string, number[]>>({});
  const [rolling, setRolling] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 120 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const rollerRef = useRef<HTMLDivElement>(null);

  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 260, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y)),
      });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset]);

  const adjustCount = useCallback((diceId: string, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [diceId]: Math.max(0, Math.min(99, (prev[diceId] || 0) + delta)),
    }));
  }, []);

  const rollAll = useCallback(() => {
    setRolling(true);
    // 短暂延迟模拟掷骰动画
    setTimeout(() => {
      const newResults: Record<string, number[]> = {};
      for (const dice of DICE_TYPES) {
        const count = counts[dice.id] || 0;
        if (count > 0) {
          newResults[dice.id] = Array.from({ length: count }, () =>
            Math.floor(Math.random() * dice.sides) + 1
          );
        }
      }
      setResults(newResults);
      setRolling(false);
    }, 200);
  }, [counts]);

  const total = Object.entries(results).reduce((sum, [, rolls]) => {
    return sum + rolls.reduce((a, b) => a + b, 0);
  }, 0);

  const hasDice = Object.values(counts).some(c => c > 0);

  return ReactDOM.createPortal(
    <div
      ref={rollerRef}
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        width: "250px",
      }}
    >
      {/* 主面板 */}
      <div
        className="bg-stone-900/95 backdrop-blur-sm rounded-xl border border-stone-700/80 shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      >
        {/* 标题栏 - 可拖拽 */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-stone-800/80 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <span className="text-stone-300 text-xs font-medium tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            掷骰器
          </span>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 transition-colors p-0.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 骰子选择区域 */}
        <div className="px-3 py-2 space-y-1">
          {DICE_TYPES.map(dice => (
            <div key={dice.id} className="flex items-center gap-2">
              {/* 骰子标签 */}
              <span
                className="text-xs font-mono font-bold w-8 text-right"
                style={{ color: dice.color }}
              >
                {dice.label}
              </span>
              {/* 数量控制 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustCount(dice.id, -1)}
                  disabled={(counts[dice.id] || 0) <= 0}
                  className="w-5 h-5 flex items-center justify-center rounded bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  −
                </button>
                <span className="w-6 text-center text-stone-200 text-xs font-mono">
                  {counts[dice.id] || 0}
                </span>
                <button
                  onClick={() => adjustCount(dice.id, 1)}
                  disabled={(counts[dice.id] || 0) >= 99}
                  className="w-5 h-5 flex items-center justify-center rounded bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  +
                </button>
              </div>
              {/* 结果预览 */}
              <div className="flex-1 text-right">
                {results[dice.id] && results[dice.id]!.length > 0 && (
                  <span className="text-stone-400 text-[10px] font-mono">
                    {results[dice.id]!.join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 掷骰按钮 + 总计 */}
        <div className="px-3 py-2 border-t border-stone-700/50 flex items-center justify-between">
          <button
            onClick={rollAll}
            disabled={!hasDice || rolling}
            className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 disabled:cursor-not-allowed text-amber-50 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            {rolling ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                掷骰中...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                掷骰
              </>
            )}
          </button>
          {total > 0 && (
            <div className="text-right">
              <span className="text-stone-500 text-[10px]">总计</span>
              <div className="text-amber-300 text-sm font-bold font-mono">{total}</div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}