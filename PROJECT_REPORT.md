# DND5E 角色构建器 - 项目报告

## 📋 项目概述

- **项目名称**: DND5E 角色构建器 (DND5E-builder)
- **原项目地址**: https://github.com/Youye39/DND5E-builder
- **你的仓库**: https://github.com/110WSR/110WSR.github.io
- **在线访问**: https://110wsr.github.io/
- **技术栈**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4

---

## 🛠 已完成的工作

### 1. 复刻原项目
- 从 https://github.com/Youye39/DND5E-builder 下载源码
- 将 `dndbuilder/` 子目录的内容移到仓库根目录
- 推送到你的 GitHub 仓库 `110WSR/110WSR.github.io`

### 2. 环境配置
- **本地工作目录**: `f:\5ednd`
- **Git 已安装**: `C:\Program Files\Git\bin\git.exe`
- **Node.js 已安装**: 系统已安装 npm
- **Python 已安装**: 系统已安装 Python (D:\minicoda3)

### 3. 部署配置
- **部署方式**: GitHub Pages + GitHub Actions 自动部署
- **配置文件**: `.github/workflows/deploy.yml`
- **触发条件**: 推送到 `main` 分支时自动构建部署
- **Netlify 配置**: `netlify.toml`（可选，如需 Netlify 部署可直接使用）

### 4. 项目结构

```
f:\5ednd/
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions 自动部署配置
├── data/                    # 游戏数据文件
│   ├── armor.json           # 护甲数据
│   ├── armorOptions.ts      # 护甲选项
│   ├── classData.json       # 职业数据
│   ├── classIdentifiers.json # 职业标识
│   ├── damageTypes.json     # 伤害类型
│   ├── languages.json       # 语言数据
│   ├── tools.json           # 工具数据
│   ├── traitKeywords.json   # 特性关键词
│   ├── traitTagPresets.json # 特性标签预设
│   ├── weaponPresets.json   # 武器预设
│   ├── weaponTags.json      # 武器标签
│   └── weapons.json         # 武器数据
├── src/                     # 源代码
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   ├── index.css            # 全局样式
│   ├── assets/              # 资源文件
│   │   ├── arrow.tsx        # 箭头图标
│   │   ├── dnd.ts           # DND 图标
│   │   ├── flag.ts          # 旗帜图标
│   │   └── star.ts          # 星星图标
│   ├── dialogs/             # 对话框组件
│   │   ├── ArchiveDialog.tsx    # 存档对话框
│   │   ├── BottomToolbar.tsx    # 底部工具栏
│   │   ├── CustomItemDialog.tsx # 自定义物品对话框
│   │   └── ExportPdfDialog.tsx  # 导出 PDF 对话框
│   ├── features/            # 功能模块
│   │   ├── back-info/       # 背景信息
│   │   ├── character/       # 角色信息（核心）
│   │   │   ├── AttackPanel.tsx         # 攻击面板
│   │   │   ├── AttributeComponent.tsx  # 属性组件
│   │   │   ├── BasicInfo.tsx           # 基本信息
│   │   │   ├── CharacterName.tsx       # 角色名称
│   │   │   ├── CoinComponent.tsx       # 货币组件
│   │   │   ├── CombatStatBox.tsx       # 战斗状态
│   │   │   ├── DeathSaveComponent.tsx  # 死亡豁免
│   │   │   ├── EquipmentPanel.tsx      # 装备面板
│   │   │   ├── ItemDialog.tsx          # 物品对话框
│   │   │   ├── ItemTooltip.tsx         # 物品提示
│   │   │   ├── LevelDisplay.tsx        # 等级显示
│   │   │   ├── PassivePerception.tsx   # 被动感知
│   │   │   ├── PersonalityTraitComponent.tsx # 个性特质
│   │   │   ├── ProficiencyBonusComponent.tsx # 熟练加值
│   │   │   ├── ProficiencyPanel.tsx    # 熟练面板
│   │   │   ├── SavingThrowComponent.tsx # 豁免投掷
│   │   │   ├── SavingThrowPanel.tsx    # 豁免面板
│   │   │   ├── SkillButtonComponent.tsx # 技能按钮
│   │   │   ├── SkillComponent.tsx      # 技能组件
│   │   │   ├── SkillPanel.tsx          # 技能面板
│   │   │   ├── TraitDialog.tsx         # 特性对话框
│   │   │   ├── TraitsPanel.tsx         # 特性面板
│   │   │   ├── TraitTooltip.tsx        # 特性提示
│   │   │   ├── WeaponComponent.tsx     # 武器组件
│   │   │   ├── WeaponTip.tsx           # 武器提示
│   │   │   └── weapons/
│   │   │       └── types.ts            # 武器类型定义
│   │   └── spells/          # 法术模块
│   │       ├── Cantrip.tsx         # 戏法
│   │       ├── Header.tsx          # 法术表头
│   │       ├── SlotIndicator.tsx   # 法术位指示器
│   │       ├── Spell.tsx           # 法术组件
│   │       ├── SpellBonusTip.tsx   # 法术加值提示
│   │       ├── SpellBox.tsx        # 法术框
│   │       ├── SpellDialog.tsx     # 法术对话框
│   │       ├── SpellTip.tsx        # 法术提示
│   │       └── SpellTooltip.tsx    # 法术工具提示
│   ├── pages/               # 页面组件
│   │   ├── PageFront.tsx    # 角色卡正面
│   │   ├── PageBack.tsx     # 角色卡背面
│   │   └── PageSpell.tsx    # 法术页面
│   ├── shared/              # 共享模块
│   │   ├── dialogs/         # 通用对话框
│   │   ├── storage/         # 存储服务
│   │   │   ├── CharacterContext.tsx  # 角色状态管理
│   │   │   ├── customDataService.ts  # 自定义数据服务
│   │   │   ├── exportService.ts      # 导出服务
│   │   │   ├── imageStore.ts         # 图片存储
│   │   │   ├── storageService.ts     # 本地存储服务
│   │   │   └── types.ts              # 存储类型定义
│   │   ├── tokens/          # 设计令牌
│   │   │   └── colors.ts    # 颜色定义
│   │   ├── types/           # 类型定义
│   │   │   ├── NewInterface.ts  # 新接口定义
│   │   │   └── types.ts         # 类型定义
│   │   └── ui/              # UI 组件
│   │       ├── ButtonComponent.tsx    # 按钮
│   │       ├── EditableScrollArea.tsx # 可编辑滚动区域
│   │       ├── FunctionButton.tsx     # 功能按钮
│   │       ├── MultiSelectDialog.tsx  # 多选对话框
│   │       ├── ScrollArea.tsx         # 滚动区域
│   │       ├── SectionContainer.tsx   # 区块容器
│   │       ├── StepperButton.tsx      # 步进按钮
│   │       └── logo.tsx              # Logo
│   └── styles/              # 样式
│       ├── fonts.css        # 字体样式
│       └── theme.css        # 主题样式
├── index.html               # HTML 入口
├── package.json             # 依赖配置
├── vite.config.ts           # Vite 构建配置
├── tsconfig.json            # TypeScript 配置
├── tsconfig.app.json        # TypeScript 应用配置
├── tsconfig.node.json       # TypeScript Node 配置
├── eslint.config.js         # ESLint 配置
├── netlify.toml             # Netlify 部署配置
└── .gitignore               # Git 忽略规则
```

---

## 🔧 开发环境

### 本地开发命令
```bash
# 安装依赖
npm install

# 启动开发服务器（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint
```

### 依赖列表
| 依赖 | 版本 | 用途 |
|------|------|------|
| react | ^19.2.6 | UI 框架 |
| react-dom | ^19.2.6 | DOM 渲染 |
| vite | ^8.0.12 | 构建工具 |
| typescript | ~6.0.2 | 类型检查 |
| tailwindcss | ^4.1.12 | CSS 框架 |
| lucide-react | ^0.487.0 | 图标库 |
| jspdf | ^4.2.1 | PDF 导出 |
| html2canvas | ^1.4.1 | 截图导出 |
| dom-to-image-more | ^3.10.0 | DOM 转图片 |
| @radix-ui/react-dialog | ^1.1.6 | 对话框组件 |

---

## 🚀 部署说明

### GitHub Pages（当前使用）
- 配置文件: `.github/workflows/deploy.yml`
- 触发方式: 推送到 `main` 分支自动部署
- 访问地址: https://110wsr.github.io/
- 部署流程: `npm ci` → `npm run build` → 上传 `dist/` → 部署到 Pages

### Netlify（可选）
- 配置文件: `netlify.toml`
- 部署方式: 在 Netlify 网站导入 GitHub 仓库即可
- 访问地址: `https://xxx.netlify.app`

---

## 💡 后续改进建议

### 功能改进
1. **多语言支持** - 添加英文/中文切换
2. **数据持久化** - 使用 IndexedDB 替代 localStorage
3. **角色模板** - 预设多种职业角色模板
4. **分享功能** - 生成角色卡分享链接
5. **导入/导出** - 支持 JSON 格式导入导出角色数据
6. **移动端适配** - 优化手机端显示
7. **更多规则书** - 添加更多扩展规则书数据
8. **角色对比** - 支持多个角色卡对比

### 技术改进
1. **状态管理** - 引入 Zustand 或 Jotai 替代 Context
2. **路由** - 添加 React Router 支持多页面
3. **测试** - 添加单元测试和 E2E 测试
4. **PWA** - 配置 Service Worker 支持离线使用
5. **性能优化** - 代码分割、懒加载
6. **CI/CD** - 添加自动化测试流程

---

## 📝 注意事项

1. **Git 路径**: `C:\Program Files\Git\bin\git.exe`（未加入系统 PATH）
2. **Node.js**: 已安装，版本可通过 `node --version` 查看
3. **工作目录**: `f:\5ednd`
4. **GitHub 仓库**: `110WSR/110WSR.github.io`（默认分支: main）
5. **本地修改后推送即可自动部署**，无需手动操作