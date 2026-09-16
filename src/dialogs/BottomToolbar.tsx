interface BottomToolbarProps {
  onExportFileClick: () => void;
  onBuildGuideClick: () => void;
  onArchiveManageClick: () => void;
  onCustomItemClick: () => void;
}

/** 顶部导航栏内嵌的紧凑工具按钮组（原底部悬浮工具栏已上移，避免遮挡角色卡画面） */
export default function BottomToolbar({
  onExportFileClick,
  // onBuildGuideClick,
  onArchiveManageClick,
  onCustomItemClick,
}: BottomToolbarProps) {
  const btn =
    "px-2.5 py-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-md " +
    "transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap";
  return (
    <div className="flex items-center gap-1">
      <button onClick={onExportFileClick} className={btn} title="导出 PDF / 文件">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        导出
      </button>
      <button onClick={onArchiveManageClick} className={btn} title="存档管理">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
        </svg>
        存档
      </button>
      <button onClick={onCustomItemClick} className={btn} title="自定义项管理">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 114 0m-4 0V2m0 6v14m0 0a2 2 0 104 0m-4 0l4 4m0-11l4-4m0 4a2 2 0 114 0m-4 4l4 4m0 4a2 2 0 10-4 0" />
        </svg>
        自定义
      </button>
    </div>
  );
}
