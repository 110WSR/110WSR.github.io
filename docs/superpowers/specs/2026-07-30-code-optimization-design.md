# 代码优化与仓库整理设计文档

> 日期：2026-07-30
> 目标：在不改变原有功能和界面布局的前提下，全面优化代码质量与性能，整理仓库并推送到 GitHub
> 项目：D&D 5e 角色构建器（React 19 + TypeScript + Vite + Tailwind CSS v4）

## 背景与现状

- 108 个源文件，约 1.76 万行，构建正常（`tsc -b && vite build` 通过）
- ESLint 有 **164 个问题**（129 错误 / 35 警告）：
  - `@typescript-eslint/no-explicit-any` × 60
  - `react-hooks/rules-of-hooks` × 37（潜在 bug）
  - `react-hooks/exhaustive-deps` × 35
  - `react-hooks/set-state-in-effect` 少量
  - `react-refresh/only-export-components` × 2
- 超大文件：`PageFront.tsx` 1151 行、`AttackPanel.tsx` 761 行、`ItemDialog.tsx` 704 行、`PlayerProfileCreator.tsx` 677 行
- 打包体积 1.17MB（gzip 339KB），单 chunk，有代码分割警告
- 仓库跟踪着开发杂物：`5e.txt`~`5e8.txt`（~3MB）、13MB 玩家手册 PDF、Gemini 网页导出（~3MB）、`5e_files/`、`chm_extracted/`、一次性 Python 脚本
- README 仍是 Vite 模板默认内容
- 远程仓库：`https://github.com/110WSR/110WSR.github.io.git`，push 到 `main` 自动触发 GitHub Pages 部署

## 核心约束

1. **不改变任何现有功能**（包括已知的行为细节）
2. **不改变界面布局与样式**
3. 修复 Hooks 规则违规时，以保持现有表现为原则（这些违规是潜在 bug，修复旨在消除状态错乱风险）

## 实施方案：分阶段安全重构（方案 A）

每阶段独立提交，阶段完成后必须通过 `npm run lint`（阶段二起要求清零）+ `npm run build` 验证。

### 阶段一：仓库整理

**从 git 移除（本地磁盘保留，不删除）：**
- `5e.txt` ~ `5e8.txt`
- `5eDnD_玩家手册PHB_中译v1.72版.pdf`
- `PDF 转换为 TXT 文本 - Google Gemini.html` 及同名 `_files/` 目录
- `5e_files/`
- `chm_extracted/`
- `extract_data.py`、`extract_class_data.py`、`replace_hitdice.py`

**保留：** `src/`、`data/`、`public/`、`DND_2024_*` 知识库文件、项目文档、`structure.txt`、配置文件。结构化 JSON（`5E_*_Structured.json`）先检查代码引用情况再决定去留。

**其他：**
- `.gitignore` 增加上述杂物规则，防止再次误提交
- 重写 `README.md`：项目简介、功能列表、技术栈、本地开发/构建命令、部署说明

### 阶段二：Lint 清零（164 个问题）

| 类型 | 数量 | 修法 |
|---|---|---|
| `no-explicit-any` | 60 | 逐个替换为真实类型；数据形状不明时定义接口或用 `unknown` + 类型守卫 |
| `rules-of-hooks` | 37 | 消除条件调用 Hook（提前 return 移到 Hook 之后、拆分子组件） |
| `exhaustive-deps` | 35 | 补全依赖数组；确有意的省略用 ref 或 eslint-disable 注释并注明原因 |
| `set-state-in-effect` | 少量 | 改为渲染期派生状态或事件回调中设置 |
| `only-export-components` | 2 | 非组件导出移到独立模块 |

每类修完跑 `lint` + `build` 验证，全部清零后提交。

### 阶段三：大文件拆分

纯代码移动，不改逻辑、不改样式。每拆一个文件验证一次构建。

**`PageFront.tsx`（1151 行 → 主文件 ~150 行 + 6 个子文件）**，拆到 `src/features/sheet-front/`：
- `HealthSection.tsx` — HPDisplay、TempHPDisplay、HealthSection、AutoFontInput
- `RestSection.tsx` — ShortRestClock、LongRestClock、RestIcon、HitDiceDisplay、DeathSaveDisplay、RestsAndDeathSection
- `CombatStats.tsx` — CombatStatsRow、CombatSection
- `InfoSections.tsx` — BasicInfoSection、PersonalityPanel
- `CoinsEquipment.tsx` — CoinsGrid、EquipmentAndCoinsSection
- `AttributesSkills.tsx` — AttributesPanel、SkillsPanel
- `PageFront.tsx` 只保留布局组装

**`AttackPanel.tsx`（761 行）** — 纯计算函数（`parseDice`、`consolidateItemDamage`、`getItemAttackBonus`、`getSpellDamage` 等）抽到 `attackCalculations.ts`。

**`ItemDialog.tsx`（704 行）** — 内部小组件（`FeatureRow`、`TagPicker`、`CustomSelect`、`GhostInput` 等）拆到 `item-dialog/` 子目录。

**`PlayerProfileCreator.tsx`（677 行）** — 实施时先分析内部结构，拆 2-3 个子组件。

**共享常量：** `FVAR`、`T` 等在多个文件重复定义的样式常量统一抽到 `src/shared/tokens/sheetStyles.ts`。

### 阶段四：性能优化

1. **路由懒加载**：`MainMenu`、`CharacterCreator`、`PlayerProfileCreator`、`CharacterSheetPage` 用 `React.lazy` + `Suspense` 按路由分割
2. **vendor 分包**：`vite.config.ts` 配置 manualChunks（react 生态、jspdf/html2canvas、radix 各自独立 chunk）
3. **大 JSON 按需加载**：`5E_Spells_Structured.json`（388KB）、`magicItems.json` 等改为动态 `import()`，打开对应对话框时才加载

预期：首屏加载体积从 1.17MB 降到 ~300-400KB（minified）。

### 阶段五：验证与推送

项目无测试套件，验证分三层：
1. 每阶段后 `npm run build` 必须通过；`npm run lint` 从阶段二完成时起要求清零
2. 全部完成后启动 dev 服务器，检查主菜单 → 建卡 → 角色卡 → 法术页核心流程渲染正常
3. 用户人工确认常用功能无误后，执行 `git push`（触发 Pages 自动部署）

提交粒度：设计文档 1 个 commit + 4 个阶段各 1 个 commit，全部本地验证通过后一次性推送。

## 错误处理

- 任何阶段构建/lint 失败：修复后再提交，不带病进入下一阶段
- 修复 Hooks 违规时发现行为变化风险：优先保持现有行为，必要时保留原结构仅加 eslint-disable 注释并记录原因
- 拆分文件时遇到组件间隐式耦合（共享闭包变量）：提取为 props 传递，保持渲染输出不变

## 不做的事（YAGNI）

- 不引入测试框架（本期只做重构，可后续单独立项）
- 不升级/更换任何依赖
- 不改动数据文件内容
- 不做 UI/交互的任何"改进"
