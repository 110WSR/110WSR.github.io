import { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import SectionContainer from "../../shared/ui/SectionContainer";
import ScrollArea from "../../shared/ui/ScrollArea";
import { useCharacter } from "../../shared/storage/CharacterContext";
import type { Item } from "../../shared/types/types";
import { createDefaultItem } from "../../shared/types/types";
import { EquipmentLibraryDialog } from "../character/EquipmentLibraryDialog";
import { sheetColors } from "../../shared/tokens/colors";

interface InventorySectionProps {
  value: string;
  onChange: (value: string) => void;
}

export default function InventorySection({ value, onChange }: InventorySectionProps) {
  const { character, updateCharacter } = useCharacter();
  const items = character?.items ?? [];
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ index: number; x: number; y: number } | null>(null);

  // 解析库存文本为结构化条目列表
  const inventoryLines = value
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
    .map((line, i) => {
      // 尝试解析 "物品名×N" 格式
      const match = line.match(/^(.+?)×(\d+)$/);
      if (match) {
        return { id: `inv_${i}_${match[1]}`, name: match[1].trim(), quantity: parseInt(match[2]), line };
      }
      return { id: `inv_${i}_${line}`, name: line, quantity: 1, line };
    });

  // 从库存移回装备栏
  const handleMoveToEquipment = useCallback((_invId: string, name: string, quantity: number) => {
    // 从库存文本中移除该行
    const lines = value.split("\n").filter(Boolean);
    const newLines = lines.filter(line => {
      const match = line.match(/^(.+?)×(\d+)$/);
      const lineName = match ? match[1].trim() : line.trim();
      return lineName !== name;
    });
    onChange(newLines.join("\n"));

    // 添加到装备栏
    const existingItem = items.find(it => it.name === name);
    if (existingItem) {
      // 如果已存在同名物品，增加数量
      const newItems = items.map(it =>
        it.id === existingItem.id
          ? { ...it, quantity: it.quantity + quantity }
          : it
      );
      updateCharacter({ items: newItems });
    } else {
      // 创建新物品
      const newItem = createDefaultItem(name);
      newItem.quantity = quantity;
      updateCharacter({ items: [...items, newItem] });
    }
  }, [value, onChange, items, updateCharacter]);

  // 从装备栏取回（装备栏 → 库存）
  const handleFetchFromEquipment = useCallback(() => {
    if (!items || items.length === 0) return;
    // 取回最后一件装备
    const lastItem = items[items.length - 1];
    const label = lastItem.quantity > 1 ? `${lastItem.name}×${lastItem.quantity}` : lastItem.name;
    const prefix = value ? `${value}\n` : "";
    onChange(`${prefix}${label}`);
    // 从装备栏移除
    const newItems = items.filter((_, i) => i !== items.length - 1);
    updateCharacter({ items: newItems });
    setContextMenu(null);
  }, [items, value, onChange, updateCharacter]);

  // 从装备库选择后添加到库存
  const handleLibrarySelect = useCallback((item: Item) => {
    const label = item.quantity > 1 ? `${item.name}×${item.quantity}` : item.name;
    const prefix = value ? `${value}\n` : "";
    onChange(`${prefix}${label}`);
  }, [value, onChange]);

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, invId: string) => {
    e.preventDefault();
    const idx = inventoryLines.findIndex(l => l.id === invId);
    if (idx >= 0) {
      setContextMenu({ index: idx, x: e.clientX, y: e.clientY });
    }
  }, [inventoryLines]);

  const handleDeleteFromInventory = useCallback((invId: string) => {
    const lines = value.split("\n").filter(Boolean);
    const entry = inventoryLines.find(l => l.id === invId);
    if (!entry) return;
    const newLines = lines.filter(line => {
      const match = line.match(/^(.+?)×(\d+)$/);
      const lineName = match ? match[1].trim() : line.trim();
      return lineName !== entry.name;
    });
    onChange(newLines.join("\n"));
    setContextMenu(null);
  }, [value, onChange, inventoryLines]);

  return (
    <>
      <SectionContainer title="库存与财宝" className="h-[464px] left-[491px] top-[1068px] w-[679px]">
        <ScrollArea className="absolute bottom-[33px] left-[14px] h-[422px] w-[651px]">
          <div className="pl-[8px] pt-[5px] pb-[5px] min-h-full">
            {inventoryLines.length === 0 ? (
              <span className="text-sheet-text-placeholder font-serif-regular-cjk text-[18px]">
                库存为空
              </span>
            ) : (
              inventoryLines.map((entry) => (
                <div key={entry.id} className="flex items-center gap-1 group">
                  <span
                    className="font-serif-regular-cjk text-[18px] text-black leading-normal cursor-pointer hover:bg-sheet-hover-bg rounded-[1px] px-[2px]"
                    onContextMenu={(e) => handleContextMenu(e, entry.id)}
                  >
                    {entry.line}
                  </span>
                  {/* 移回装备栏按钮 */}
                  <button
                    onClick={() => handleMoveToEquipment(entry.id, entry.name, entry.quantity)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-sheet-text-placeholder hover:text-sheet-accent-blue ml-1"
                    title="移入装备栏"
                  >
                    [装备]
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* 装备库按钮 */}
        <button
          onClick={() => setLibraryOpen(true)}
          className="absolute bottom-[6px] right-[10px] text-[11px] text-sheet-text-placeholder hover:text-sheet-text-secondary transition-colors font-serif-regular-cjk"
        >
          装备库
        </button>
      </SectionContainer>

      {/* 装备库检索 */}
      <EquipmentLibraryDialog
        open={libraryOpen}
        onSelect={handleLibrarySelect}
        onClose={() => setLibraryOpen(false)}
      />

      {/* 右键菜单 */}
      {contextMenu && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: sheetColors.cardBg,
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
              minWidth: "100px",
              zIndex: 10000,
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              onClick={() => {
                const entry = inventoryLines[contextMenu.index];
                if (entry) handleMoveToEquipment(entry.id, entry.name, entry.quantity);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                color: sheetColors.textDark,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              移入装备栏
            </div>
            <div
              onClick={handleFetchFromEquipment}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                color: sheetColors.textDark,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              从装备栏取回
            </div>
            <div
              onClick={() => {
                const entry = inventoryLines[contextMenu.index];
                if (entry) handleDeleteFromInventory(entry.id);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                color: sheetColors.textDark,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              删除
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}