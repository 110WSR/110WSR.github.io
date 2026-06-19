import React from "react";
import ReactDOM from "react-dom";
import { sheetColors } from "../../shared/tokens/colors";
import type { AttackEntry, Item } from "../../shared/types/types";

interface AttackContextMenuProps {
  /** 右键点击的条目索引 */
  index: number;
  /** 鼠标位置 */
  x: number;
  y: number;
  /** 该条目对应的 AttackEntry */
  entry: AttackEntry;
  /** 该条目对应的物品（仅 weapon 类型有） */
  item?: Item;
  /** 关闭菜单 */
  onClose: () => void;
  /** 删除条目 */
  onDelete: (index: number) => void;
  /** 移入装备栏（仅武器） */
  onMoveToEquipment: (index: number) => void;
  /** 移入库存（仅武器） */
  onMoveToInventory: (index: number) => void;
}

/**
 * 攻击栏右键菜单组件
 * 为武器条目提供：移入装备栏、移入库存、删除
 */
export default function AttackContextMenu({
  index,
  x,
  y,
  entry,
  onClose,
  onDelete,
  onMoveToEquipment,
  onMoveToInventory,
}: AttackContextMenuProps) {
  const isWeapon = entry.type === "weapon";

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div
        style={{
          position: "fixed",
          left: x,
          top: y,
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
        {isWeapon && (
          <MenuItem onClick={() => { onMoveToEquipment(index); onClose(); }}>
            移入装备栏
          </MenuItem>
        )}
        {isWeapon && (
          <MenuItem onClick={() => { onMoveToInventory(index); onClose(); }}>
            移入库存
          </MenuItem>
        )}
        <MenuItem onClick={() => { onDelete(index); onClose(); }}>
          删除
        </MenuItem>
      </div>
    </div>,
    document.body
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "4px 10px",
        fontSize: "12px",
        color: sheetColors.textDark,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sheetColors.hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {children}
    </div>
  );
}