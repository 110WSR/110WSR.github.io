import { useNavigate } from "react-router-dom";
import { useCharacter } from "../shared/storage/CharacterContext";
import { useEffect, useState } from "react";

// ============================================================================
// D&D 5e 主菜单页面
// ============================================================================

function DragonIcon() {
  return (
    <svg viewBox="0 0 120 80" className="w-20 h-14 mx-auto mb-3 opacity-80">
      <path
        d="M10 60 L25 30 L40 45 L55 15 L70 40 L85 20 L100 50 L110 40 L105 55 L95 50 L85 65 L70 50 L55 65 L40 50 L25 65 L10 60Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-amber-700"
      />
    </svg>
  );
}

export default function MainMenu() {
  const navigate = useNavigate();
  const { saveList, switchCharacter, character } = useCharacter();
  const [recentSaves, setRecentSaves] = useState(saveList.slice(0, 5));

  useEffect(() => {
    setRecentSaves(saveList.slice(0, 5));
  }, [saveList]);

  const handleContinue = () => {
    if (character) {
      navigate("/sheet");
    }
  };

  const handleLoadSave = (id: string) => {
    switchCharacter(id);
    navigate("/sheet");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 flex flex-col items-center justify-center p-8">
      {/* 装饰性背景纹理 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #d4a574 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #d4a574 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 主内容 */}
      <div className="relative z-10 max-w-2xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <DragonIcon />
          <h1 className="text-5xl font-bold text-amber-100 tracking-wider mb-2"
            style={{ fontFamily: "'Noto Serif', 'Noto Serif SC', serif" }}>
            D&D 5e
          </h1>
          <p className="text-2xl text-amber-300/80 tracking-widest"
            style={{ fontFamily: "'Noto Serif', 'Noto Serif SC', serif" }}>
            角色构建器
          </p>
          <div className="w-24 h-0.5 bg-amber-600/50 mx-auto mt-4" />
        </div>

        {/* 主菜单按钮 */}
        <div className="space-y-4 mb-12">
          <button
            onClick={() => navigate("/create")}
            className="w-full py-4 px-6 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg
                       transition-all duration-200 shadow-lg hover:shadow-amber-700/30
                       text-lg font-semibold tracking-wider border border-amber-600/50
                       hover:border-amber-500/50 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            创建新角色
          </button>

          <button
            onClick={handleContinue}
            disabled={!character}
            className="w-full py-4 px-6 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg
                       transition-all duration-200 shadow-lg hover:shadow-stone-700/30
                       text-lg font-semibold tracking-wider border border-stone-600/50
                       hover:border-stone-500/50 disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:bg-stone-700 disabled:hover:shadow-none
                       flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            继续编辑当前角色
          </button>

          <button
            onClick={() => navigate("/sheet")}
            className="w-full py-4 px-6 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg
                       transition-all duration-200 shadow-lg hover:shadow-stone-700/30
                       text-lg font-semibold tracking-wider border border-stone-600/50
                       hover:border-stone-500/50 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            角色卡面板
          </button>
        </div>

        {/* 最近存档 */}
        {recentSaves.length > 0 && (
          <div className="bg-stone-800/50 rounded-lg border border-stone-700/50 p-4">
            <h3 className="text-stone-400 text-sm tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              最近存档
            </h3>
            <div className="space-y-2">
              {recentSaves.map((save) => (
                <button
                  key={save.id}
                  onClick={() => handleLoadSave(save.id)}
                  className="w-full text-left px-4 py-2.5 rounded-md bg-stone-700/30 hover:bg-stone-700/50
                             transition-colors duration-150 flex items-center justify-between group"
                >
                  <span className="text-stone-300 group-hover:text-amber-300 transition-colors">
                    {save.name}
                  </span>
                  <span className="text-stone-500 text-xs">
                    {new Date(save.updatedAt).toLocaleDateString("zh-CN")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 底部信息 - 感谢与引用声明 */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-stone-600 text-xs tracking-wider">
            基于 D&D 5e 玩家手册 · 非官方工具
          </p>
          <div className="text-stone-700 text-[10px] leading-relaxed max-w-md mx-auto">
            <p>
              角色卡页面 UI 设计基于{' '}
              <a
                href="https://github.com/Youye39/DND5E-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-amber-500 transition-colors underline underline-offset-2"
              >
                Youye39/DND5E-builder
              </a>
              {' '}（MIT 许可证），感谢原作者的出色工作。
            </p>
            <p className="mt-1">
              5e 玩家手册中文翻译文本来源于{' '}
              <a
                href="https://github.com/Youye39/DND5E-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-amber-500 transition-colors underline underline-offset-2"
              >
                5eDnD 中文社区
              </a>
              ，遵循其相应许可条款使用。
            </p>
            <p className="mt-1">
              D&D 5e 为 Wizards of the Coast 的注册商标。本工具为粉丝自制非营利项目，仅供学习交流。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}