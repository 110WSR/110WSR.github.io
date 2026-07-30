# D&D 5e 角色构建器

基于 D&D 5e 规则的非官方角色卡工具，支持网页端创建、管理和导出角色卡。

**在线使用：** https://110wsr.github.io/

## 功能

- 🎲 两种建卡方式：通用快速建卡向导、玩家画像式智能建卡（基于偏好问卷推荐职业/种族/背景）
- 📋 完整角色卡：属性、技能、豁免、生命值、攻击、装备、货币、特质
- ✨ 法术系统：法术位管理、按职业过滤的法术库、法术详情自动填充
- 🎒 装备库：971 件魔法物品、冒险装备、武器预设
- 📄 导出/导入：JSON 备份、PDF 导出、角色卡图片导出
- 🗂️ 多角色存档管理
- 📱 移动端适配

## 技术栈

- React 19 + TypeScript
- Vite 8（rolldown）
- Tailwind CSS v4
- React Router 7（HashRouter，兼容 GitHub Pages）
- Radix UI / lucide-react
- jspdf + html2canvas（PDF/图片导出）

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 类型检查 + 生产构建
npm run lint     # ESLint 检查
npm run preview  # 预览生产构建
```

## 部署

push 到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages（见 `.github/workflows/deploy.yml`）。

## 免责声明

本项目为粉丝自制工具，与 Wizards of the Coast 无关。D&D 相关内容版权归原持有者所有。
