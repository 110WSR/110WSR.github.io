import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { CharacterProvider } from "./shared/storage/CharacterContext";
import MainMenu from "./pages/MainMenu";
import CharacterCreator from "./pages/CharacterCreator";
import CharacterSheetPage from "./pages/CharacterSheetPage";
import PlayerProfileCreator from "./pages/PlayerProfileCreator";

// ============================================================================
// 应用根组件 - 路由配置
// 使用 HashRouter 以兼容 GitHub Pages 静态托管
// ============================================================================

export default function App() {
  return (
    <HashRouter>
      <CharacterProvider>
        <Routes>
          {/* 主菜单（开始页面） */}
          <Route path="/" element={<MainMenu />} />
          
          {/* 通用快速建卡（原有流程） */}
          <Route path="/create" element={<CharacterCreator />} />
          
          {/* 玩家画像式建卡（基于知识库的智能推荐） */}
          <Route path="/profile-create" element={<PlayerProfileCreator />} />
          
          {/* 角色卡面板（整合原有功能） */}
          <Route path="/sheet" element={<CharacterSheetPage />} />
          
          {/* 默认重定向到主菜单 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CharacterProvider>
    </HashRouter>
  );
}
