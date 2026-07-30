# 代码优化与仓库整理实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变功能和布局的前提下，清理仓库杂物、Lint 清零（164 问题）、拆分 4 个超大文件、路由级代码分割与数据按需加载，最后推送到 GitHub。

**Architecture:** 分 4 阶段顺序执行：①仓库整理 → ②Lint 清零 → ③大文件拆分（纯代码移动）→ ④性能优化（懒加载/分包/JSON 动态导入）。每任务结束验证 `npm run build`，阶段二结束验证 `npm run lint` 清零。

**Tech Stack:** React 19 + TypeScript + Vite 8（rolldown）+ Tailwind CSS v4 + ESLint 10

**Spec:** `docs/superpowers/specs/2026-07-30-code-optimization-design.md`

## Global Constraints

- **不改变任何现有功能与界面布局/样式**；所有拆分均为纯代码移动
- 不引入测试框架、不升级/新增/删除任何依赖（package.json 不动）
- 验证命令：`npm run build`（= `tsc -b && vite build`）、`npm run lint`
- 本项目无测试套件，每个任务的"验证"步骤 = 对应 lint/build 命令 + 预期的确切输出
- 提交信息风格与仓库一致：中文描述 + 约定式前缀（`refactor:`、`chore:`、`perf:`、`docs:`）
- 每个任务完成后立即 commit（比 spec 的"每阶段一个 commit"更细，作为安全回退点；最终一次性 push）
- Windows 环境，shell 为 Git Bash；git 操作中对中文文件名用引号包裹

## 关键背景信息（执行者需要知道的事实）

- 远程仓库已存在：`https://github.com/110WSR/110WSR.github.io.git`，push 到 `main` 会自动部署 GitHub Pages
- `src/pages/creator/SpellSelectionPanel.tsx:3` 静态导入了根目录的 `5E_Classes_Structured.json`（54KB，唯一被引用的根目录结构化 JSON）
- 根目录 `5E_Spells_Structured.json`（388,501 字节）与 `data/spellDetails.json`（388,501 字节）内容相同，源代码只引用后者 → 根目录那份是无引用的重复文件
- `5E_All_Items_Structured.json`、`5E_Equipment_Structured.json` 无任何源代码引用（仅在注释中提及）
- AttackPanel.tsx 的 hooks 违规根因：`src/features/character/AttackPanel.tsx:156` 的 `if (!character) return null;` 在 ~35 个 Hook 调用之前
- 大 JSON 静态导入点：`data/spellDetails.json`(388KB) ← `src/shared/utils/spellDetailsResolver.ts`；`data/magicItems.json`(66KB) + `data/adventuringGear.json` ← `src/features/character/EquipmentLibraryDialog.tsx`
- 当前打包：单 chunk `index-*.js` 1,174KB（gzip 339KB）
- Vite 8 基于 rolldown，分包配置项在 `build.rolldownOptions.output` 下；确切 API 名以 `node_modules/rolldown/dist/types/` 中的类型定义为准

---

## 阶段一：仓库整理

### Task 1: 从 git 移除开发杂物并更新 .gitignore

**Files:**
- Modify: `.gitignore`
- Remove (git only, 本地保留): `5e.txt`~`5e8.txt`、`5eDnD_玩家手册PHB_中译v1.72版.pdf`、`PDF 转换为 TXT 文本 - Google Gemini.html`、`PDF 转换为 TXT 文本 - Google Gemini_files/`、`5e_files/`、`chm_extracted/`、`extract_data.py`、`extract_class_data.py`、`replace_hitdice.py`、`5E_Spells_Structured.json`、`5E_All_Items_Structured.json`、`5E_Equipment_Structured.json`
- Move: `5E_Classes_Structured.json` → `data/5E_Classes_Structured.json`
- Modify: `src/pages/creator/SpellSelectionPanel.tsx:3`

**Interfaces:**
- Consumes: 无
- Produces: `data/5E_Classes_Structured.json`（路径变化，内容不变）

- [ ] **Step 1: 移动被引用的 JSON 并更新导入**

```bash
git mv 5E_Classes_Structured.json data/5E_Classes_Structured.json
```

修改 `src/pages/creator/SpellSelectionPanel.tsx:3`：

```ts
// 改前
import classStructuredData from "../../../5E_Classes_Structured.json";
// 改后
import classStructuredData from "../../../data/5E_Classes_Structured.json";
```

- [ ] **Step 2: git 移除杂物（本地磁盘保留）**

```bash
git rm --cached 5e.txt 5e2.txt 5e3.txt 5e4.txt 5e5.txt 5e6.txt 5e7.txt 5e8.txt
git rm --cached "5eDnD_玩家手册PHB_中译v1.72版.pdf"
git rm --cached "PDF 转换为 TXT 文本 - Google Gemini.html"
git rm -r --cached "PDF 转换为 TXT 文本 - Google Gemini_files"
git rm -r --cached 5e_files
git rm -r --cached chm_extracted
git rm --cached extract_data.py extract_class_data.py replace_hitdice.py
git rm --cached 5E_Spells_Structured.json 5E_All_Items_Structured.json 5E_Equipment_Structured.json
```

- [ ] **Step 3: 更新 .gitignore**

在 `.gitignore` 末尾追加：

```gitignore
# 开发过程文件（原始资料、一次性脚本，不入库）
5e*.txt
*.pdf
PDF 转换为 TXT 文本 - Google Gemini*
5e_files/
chm_extracted/
extract_*.py
replace_hitdice.py
5E_All_Items_Structured.json
5E_Equipment_Structured.json
5E_Spells_Structured.json
DND_2024_玩家画像式建卡指南.xlsx
```

注意：`DND_2024_玩家画像式建卡指南.xlsx` 也一并从 git 移除（`git rm --cached`，它是二进制表格，不适合 git 管理）。

- [ ] **Step 4: 验证**

Run: `npm run build`
Expected: 构建成功（`✓ built in ...`），无类型错误

Run: `git status --short`
Expected: 上述文件显示为 `D`（staged 删除）且本地文件仍存在（`ls 5e.txt` 有输出）

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: 从仓库移除开发过程文件，移动5E_Classes_Structured.json到data目录"
```

---

### Task 2: 重写 README.md

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `PROJECT_LOG.md` 中的项目信息（可参考其架构描述）
- Produces: 项目门面文档

- [ ] **Step 1: 写入新 README**

完整替换 `README.md` 内容：

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: 重写README，替换Vite模板默认内容"
```

---

## 阶段二：Lint 清零（164 → 0）

### Task 3: 修复 AttackPanel.tsx 的条件 Hook 调用（~35 个 errors）

**Files:**
- Modify: `src/features/character/AttackPanel.tsx`

**Interfaces:**
- Consumes: 现有 `AttackPanelProps`（`{ className?: string }`）
- Produces: 默认导出签名不变：`export default function AttackPanel({ className }: AttackPanelProps)`

**背景：** 第 156 行 `if (!character) return null;` 位于所有 Hook 之前，违反 hooks 规则（eslint 报 ~35 个 `rules-of-hooks` error + 关联的 `exhaustive-deps` warning）。修复模式：**wrapper/inner 组件拆分**，内部组件代码一行不改。

- [ ] **Step 1: 应用 wrapper/inner 拆分**

在 `src/features/character/AttackPanel.tsx` 中：

1. 把现有默认导出组件改名为内部组件，并把 `character` 改为 props 传入：

```tsx
// 改前（154-158 行附近）
export default function AttackPanel({ className }: AttackPanelProps) {
  const { character, updateCharacter } = useCharacter();
  if (!character) return null;

  const { items, attackEntries, attributes, ... } = character;

// 改后
interface AttackPanelInnerProps extends AttackPanelProps {
  character: Character; // 用 CharacterContext 中 character 的实际类型
}

function AttackPanelInner({ className, character }: AttackPanelInnerProps) {
  const { updateCharacter } = useCharacter();

  const { items, attackEntries, attributes, ... } = character;
```

2. 文件末尾新增 wrapper 作为默认导出：

```tsx
export default function AttackPanel({ className }: AttackPanelProps) {
  const { character } = useCharacter();
  if (!character) return null;
  return <AttackPanelInner className={className} character={character} />;
}
```

要点：
- 内部组件的其余代码（所有 useState/useRef/useMemo/useCallback）**完全不动**
- `Character` 类型从 `../../shared/storage/CharacterContext`（或其实际定义文件 `types.ts`）导入；先 `grep -n "character:" src/shared/storage/CharacterContext.tsx` 确认类型名
- 内部组件里所有用到 `character` 的地方逻辑不变（props 保证非空，与原 early return 后的可见性一致）

- [ ] **Step 2: 验证**

Run: `npm run lint 2>&1 | grep -c "AttackPanel"`
Expected: `0`（或仅剩与 hooks 无关、属于 Task 5/6 处理的 any/exhaustive-deps 条目）

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add src/features/character/AttackPanel.tsx
git commit -m "refactor: 修复AttackPanel条件Hook调用（wrapper/inner拆分）"
```

---

### Task 4: 修复其余文件的 hooks 违规

**Files:**
- Modify: `src/pages/PageFront.tsx`（1095 行附近条件 useEffect）
- Modify: `src/shared/ui/MultiSelectDialog.tsx`（set-state-in-effect）
- Modify: lint 输出中其余报 `rules-of-hooks` / `set-state-in-effect` 的文件

**Interfaces:**
- Produces: 各组件对外 props 签名不变

- [ ] **Step 1: 定位所有剩余 hooks 错误**

Run: `npm run lint 2>&1 | grep -B30 "rules-of-hooks\|set-state-in-effect" | grep -E "^F:|error"`
逐个文件处理。

- [ ] **Step 2: 修复 PageFront.tsx 条件 useEffect**

同样用 Task 3 的 wrapper/inner 模式：若 early return（如 `if (!character) return null`）在 useEffect 之前，把 early return 移到 wrapper，inner 接收非空 props。若违规是其他形态（如循环/条件分支内调用），把 Hook 提升到组件顶层，条件逻辑移入 Hook 回调内部。

- [ ] **Step 3: 修复 MultiSelectDialog.tsx 的 set-state-in-effect**

现状（37 行附近）：

```tsx
// 改前
useEffect(() => {
  if (open) setDraft(selected);
}, [open, selected]);
```

改为"渲染期重置"模式（React 官方推荐，见 react.dev/learn/you-might-not-need-an-effect）：

```tsx
// 改后：记录上一次的 open 状态，open 变 true 时在渲染期同步 draft
const [prevOpen, setPrevOpen] = useState(open);
if (open !== prevOpen) {
  setPrevOpen(open);
  if (open) setDraft(selected);
}
```

删除原 useEffect。行为等价：对话框每次打开时 draft 重置为 selected。

- [ ] **Step 4: 验证**

Run: `npm run lint 2>&1 | grep -cE "rules-of-hooks|set-state-in-effect"`
Expected: `0`

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: 修复剩余条件Hook调用和effect中同步setState问题"
```

---

### Task 5: 消除 60 处 `no-explicit-any`

**Files:**
- Modify: lint 输出中报 `@typescript-eslint/no-explicit-any` 的所有文件（集中在 `src/shared/storage/exportService.ts`、`src/pages/PageFront.tsx`、`src/pages/HPRollPanel.tsx`、`src/features/spells/Header.tsx`、`src/pages/CharacterCreator.tsx`、`src/pages/PlayerProfileCreator.tsx` 等）

**Interfaces:**
- Consumes: `src/shared/types/types.ts`、`src/shared/types/NewInterface.ts` 中已有类型
- Produces: 不新增对外 API；必要时在对应文件或 `types.ts` 中新增 interface

**修复模式（按出现频率排序）：**

1. **JSON 数据索引访问**（最高频，如 `(classData as any)[classId]`、`(classData as Record<string, any>)[classId]`）：

```ts
// 改前
const classEntry = classId ? (classData as any)[classId] : null;
// 改后：先看该 JSON 的实际结构，定义接口
interface ClassDataEntry {
  hitDie?: number;
  spellSlots?: Record<string, number[]>;
  // ...按 data/classData.json 实际字段补全
}
const classEntry = classId ? (classData as Record<string, ClassDataEntry>)[classId] : null;
```

同一个 JSON 在多个文件被索引时，接口定义放到 `src/shared/types/types.ts` 导出共用。

2. **回调参数 any**（如 `.find((c: any) => ...)`）：用数组元素的真实类型；若是 JSON import，先 `as SomeInterface[]` 再正常推导。

3. **事件/第三方库参数 any**：用 React 事件类型（`React.ChangeEvent<HTMLInputElement>` 等）或库的类型。

4. **确实无法确定形状的**：用 `unknown` + 类型守卫，不允许保留 `any`。

**禁止事项：** 不允许用 `// eslint-disable` 跳过本规则；不允许把 `any` 改成 `any[]` 或 `{ [k: string]: any }` 变相保留。

- [ ] **Step 1: 分批处理（每批一个目录）**

顺序：`src/shared/storage/` → `src/pages/` → `src/features/` → `src/dialogs/`。每批改完：

Run: `npm run build`
Expected: 构建成功（类型收紧可能暴露之前被 any 掩盖的类型错误，逐一修正访问方式，保持运行行为不变）

- [ ] **Step 2: 验证清零**

Run: `npm run lint 2>&1 | grep -c "no-explicit-any"`
Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: 消除全部explicit any，补全JSON数据结构类型定义"
```

---

### Task 6: 修复 35 处 `exhaustive-deps` 警告

**Files:**
- Modify: lint 输出中报 `react-hooks/exhaustive-deps` 的所有文件

**修复决策树（逐个警告按此判断）：**

1. **缺依赖且加上后行为正确** → 直接补进依赖数组（最常见，如 PageFront 的 `proficiencyBonus`、`setProficiencyBonus`）
2. **依赖是不稳定引用**（每次渲染新建的对象/函数，如 AttackPanel 的 `safeEntries`、`setItems`）→ 按 lint 提示用 `useMemo`/`useCallback` 包裹该值
3. **多余依赖**（lint 报 "unnecessary dependency"）→ 从数组移除
4. **确实需要省略依赖**（如只需要 mount 时执行一次，且省略是有意的）→ 把使用的值存入 ref，或保留省略并加注释：

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在 mount 时执行一次，xxx 故意不作为依赖
```

注意：方式 4 每个用法必须有明确中文注释说明为什么省略是有意的；能用 ref 改写就优先改写。

- [ ] **Step 1: 逐个处理**

Run: `npm run lint 2>&1 | grep -B30 "exhaustive-deps" | grep -E "^F:|warning"` 获取完整清单，按决策树处理。

每修一类后 Run: `npm run build` 确认构建通过；对补依赖的改动，确认不会引入"依赖变化→effect 重跑→setState→再渲染"的死循环（若出现，改用 ref 方案）。

- [ ] **Step 2: 验证**

Run: `npm run lint 2>&1 | grep -c "exhaustive-deps"`
Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: 修复全部hooks依赖数组警告"
```

---

### Task 7: 修复 react-refresh 导出违规并验收阶段二

**Files:**
- Modify: `src/shared/storage/exportService.ts` 及 lint 报 `react-refresh/only-export-components` 的另一文件（以实际 lint 输出为准）

**Interfaces:**
- Produces: 被移动的非组件导出，从新路径 re-export 或直接由使用方改导入路径

- [ ] **Step 1: 处理**

若 `.tsx` 文件同时导出组件和常量/函数/类型 → 把非组件导出移到同目录 `.ts` 文件，使用方更新 import。
若 `exportService.ts` 这类纯 `.ts` 文件被 react-refresh 误报 → 检查该文件是否误用了 `.tsx`  JSX；纯工具文件报此规则通常是因为文件里导出了非组件内容且被 eslint 的 react-refresh 插件覆盖，移动常量到独立模块即可。

- [ ] **Step 2: 阶段二总验收**

Run: `npm run lint`
Expected: `✖ 0 problems`（0 errors, 0 warnings）——若仍有残留，回到对应 Task 补齐

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: 修复react-refresh导出违规，ESLint全部清零"
```

---

## 阶段三：大文件拆分（纯代码移动）

### Task 8: 提取共享样式常量 sheetStyles.ts

**Files:**
- Create: `src/shared/tokens/sheetStyles.ts`
- Modify: 所有重复定义 `FVAR` / `T` 常量的文件（至少 `src/pages/PageFront.tsx`、`src/features/character/AttackPanel.tsx`、`src/features/character/ItemDialog.tsx`；用 `grep -rn "CTGR' 0" src/` 找全）

**Interfaces:**
- Produces:
  ```ts
  export const SHEET_FONT_VARIATION = "'CTGR' 0, 'wdth' 100";
  export const SHEET_TEXT_STYLE: React.CSSProperties = { /* T 对象的现有内容，逐字段从 PageFront.tsx 拷贝 */ };
  ```
  （保持现有导出名 `T`/`FVAR` 在使用处的本地别名：各文件 `import { SHEET_FONT_VARIATION as FVAR, SHEET_TEXT_STYLE as T } from ...`，这样文件内使用处零改动。）

- [ ] **Step 1: 对比各文件的 T/FVAR 定义**

Run: `grep -rn -A8 "const T: React.CSSProperties" src/`
若各文件定义完全一致 → 提取一份。若有细微差异 → 以使用最多的为准，差异文件保留本地定义（不强行统一，避免样式变化）。

- [ ] **Step 2: 创建 sheetStyles.ts 并替换各文件本地定义**

各文件删除本地 `const FVAR`/`const T`，改为上述别名 import。

- [ ] **Step 3: 验证 + Commit**

Run: `npm run build`
Expected: 构建成功

```bash
git add -A
git commit -m "refactor: 提取角色卡共享样式常量到sheetStyles.ts"
```

---

### Task 9: 拆分 PageFront.tsx（1151 行 → 7 个文件）

**Files:**
- Create: `src/features/sheet-front/HealthSection.tsx`（HPDisplay、TempHPDisplay、HealthSection、AutoFontInput）
- Create: `src/features/sheet-front/RestSection.tsx`（ShortRestClock、LongRestClock、RestIcon、HitDiceDisplay、DeathSaveDisplay、RestsAndDeathSection）
- Create: `src/features/sheet-front/CombatStats.tsx`（CombatStatsRow、CombatSection）
- Create: `src/features/sheet-front/InfoSections.tsx`（BasicInfoSection、PersonalityPanel）
- Create: `src/features/sheet-front/CoinsEquipment.tsx`（CoinsGrid、EquipmentAndCoinsSection）
- Create: `src/features/sheet-front/AttributesSkills.tsx`（AttributesPanel、SkillsPanel）
- Modify: `src/pages/PageFront.tsx`（只保留 CharacterCardContent、CharacterSheet 默认导出和组装逻辑）

**Interfaces:**
- Consumes: Task 8 的 `sheetStyles.ts`
- Produces: `src/pages/PageFront.tsx` 默认导出签名不变；各子文件导出的组件名与原内部函数名一致

**拆分规则：**
- 每个被移出的组件**代码逐字不变**，只补充：文件头部 import（React、useCharacter、类型、子组件间的相互引用）、`export` 关键字
- 组件间的相互调用：在新文件间用 import 连接（如 RestSection 引用 ShortRestClock 仍在同一文件，无需 import；跨文件才 import）
- 闭包捕获的共享变量（若有）→ 提升为 props 传入
- `useCharacter()` 等 hook 调用随组件一起移动，不需要改

- [ ] **Step 1: 先读 `src/pages/PageFront.tsx` 全文，画出组件依赖关系**（哪些组件互相引用、哪些引用了文件级常量），确定每个新文件的 import 清单

- [ ] **Step 2: 逐个创建新文件**（每建一个跑一次 `npm run build`）

- [ ] **Step 3: PageFront.tsx 瘦身**，组装处改为从 `./../features/sheet-front/...` import

- [ ] **Step 4: 验证 + Commit**

Run: `npm run build && npm run lint`
Expected: 构建成功、lint 0 问题

```bash
git add -A
git commit -m "refactor: 拆分PageFront为6个职责单一的子组件文件"
```

---

### Task 10: 拆分 AttackPanel.tsx — 提取纯计算函数

**Files:**
- Create: `src/features/character/attackCalculations.ts`
- Modify: `src/features/character/AttackPanel.tsx`

**Interfaces:**
- Produces（签名与原内部函数一致，加 `export`）：
  ```ts
  export function calcAbilityModNum(score: number): number
  export function parseDice(raw: string): { dice: string; flat: number }
  export function consolidateItemDamage(item: Item, attrs: AttrMap): string
  export function getItemAttackBonus(item: Item, attrs: AttrMap, profBonus: number): string
  export function getSpellDamage(spell: SpellData): string
  export function getSpellAttackDisplay(/* 保持原参数列表 */): string
  export type AttrMap = { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  ```
  （`ATTR_KEY_MAP` 常量一并移出并 export，供原函数使用）

- [ ] **Step 1: 把 AttackPanel.tsx 第 28-131 行附近的纯函数和常量移到新文件**，函数体逐字不动，补 import（`Item`、`SpellData` 类型来源文件保持原路径）

- [ ] **Step 2: AttackPanel.tsx 改为 import 这些函数**

- [ ] **Step 3: 验证 + Commit**

Run: `npm run build && npm run lint`
Expected: 全绿

```bash
git add -A
git commit -m "refactor: 提取AttackPanel纯计算逻辑到attackCalculations.ts"
```

---

### Task 11: 拆分 ItemDialog.tsx — 提取内部小组件

**Files:**
- Create: `src/features/character/item-dialog/FeatureRow.tsx`
- Create: `src/features/character/item-dialog/TagPicker.tsx`
- Create: `src/features/character/item-dialog/CustomSelect.tsx`
- Create: `src/features/character/item-dialog/inputs.tsx`（SectionLabel、GhostInput、AddButton、共享的 LABEL/MUTED 样式常量、uid()）
- Modify: `src/features/character/ItemDialog.tsx`（保留 ItemDialog 主组件、PRESETS/TAGS/DAMAGE_TYPES/ATTACK_ATTRS/presetGroups 常量）

**Interfaces:**
- Produces: `ItemDialog` 命名导出签名不变（`export function ItemDialog({ open, initialItem, onSave, onDelete, onClose }: ItemDialogProps)`）；子组件 props 类型与原内部 Props interface 一致（FeatureRowProps 等随组件移动并 export）

- [ ] **Step 1: 逐字移动子组件到各自文件**，补 import（React、类型、weaponTags/damageTypes JSON 的引用保留在主文件，通过 props 传给子组件；若子组件直接用到了这些常量，则在该子组件文件中重复同样的 JSON import —— 保持行为一致，不重构数据流）

- [ ] **Step 2: 主文件改为 import 子组件**

- [ ] **Step 3: 验证 + Commit**

Run: `npm run build && npm run lint`
Expected: 全绿

```bash
git add -A
git commit -m "refactor: 拆分ItemDialog内部子组件到item-dialog目录"
```

---

### Task 12: 拆分 PlayerProfileCreator.tsx — 提取问卷数据与解析函数

**Files:**
- Create: `src/pages/profile-creator/questionnaireData.ts`（DIFFICULTY_OPTIONS、EXPERIENCE_OPTIONS、COMPLEXITY_OPTIONS、PERSONALITY_OPTIONS、GOAL_OPTIONS、TEAM_GAP_OPTIONS、RULE_SOURCE_OPTIONS、DISLIKE_OPTIONS、CLASS_NAME_MAP、RACE_NAME_MAP、BACKGROUND_MAP、SUBCLASS_MAP 及 BuildEntry/Questionnaire interface）
- Create: `src/pages/profile-creator/profileParsers.ts`（parseAttributes、getDefaultWeapons、getDefaultArmor）
- Modify: `src/pages/PlayerProfileCreator.tsx`（保留主组件，从上述文件 import）

**Interfaces:**
- Produces:
  ```ts
  // questionnaireData.ts
  export interface BuildEntry { /* 原定义 */ }
  export interface Questionnaire { /* 原定义 */ }
  export const DIFFICULTY_OPTIONS: ... // 全部 8 个 OPTIONS 常量
  export const CLASS_NAME_MAP: Record<string, string> // 及另外 3 个 MAP
  // profileParsers.ts
  export function parseAttributes(attrStr: string): Attributes
  export function getDefaultWeapons(className: string): string[]
  export function getDefaultArmor(className: string): string
  ```

- [ ] **Step 1: 逐字移动常量、interface、纯函数**，补 import（`Attributes` 类型来源保持原路径）

- [ ] **Step 2: 主文件改为 import**

- [ ] **Step 3: 验证 + Commit**

Run: `npm run build && npm run lint`
Expected: 全绿

```bash
git add -A
git commit -m "refactor: 提取玩家画像建卡的问卷数据和解析函数"
```

---

## 阶段四：性能优化

### Task 13: 路由懒加载

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: 现有 4 个页面组件的默认导出
- Produces: 路由结构不变（路径、HashRouter 不变）

- [ ] **Step 1: 改写 App.tsx**

```tsx
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { CharacterProvider } from "./shared/storage/CharacterContext";
import MainMenu from "./pages/MainMenu"; // 主菜单保持同步加载（首屏）

const CharacterCreator = lazy(() => import("./pages/CharacterCreator"));
const PlayerProfileCreator = lazy(() => import("./pages/PlayerProfileCreator"));
const CharacterSheetPage = lazy(() => import("./pages/CharacterSheetPage"));

function RouteFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      加载中…
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <CharacterProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/create" element={<CharacterCreator />} />
            <Route path="/profile-create" element={<PlayerProfileCreator />} />
            <Route path="/sheet" element={<CharacterSheetPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </CharacterProvider>
    </HashRouter>
  );
}
```

注意：`RouteFallback` 的样式只影响懒加载等待的过渡瞬间（通常不可见），用最小化内联样式，不引入新设计。

- [ ] **Step 2: 验证分包生效**

Run: `npm run build`
Expected: 构建成功，且 `dist/assets/` 下出现多个 chunk（CharacterCreator、PlayerProfileCreator、CharacterSheetPage 各自独立），主 `index-*.js` 明显小于 1,174KB

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "perf: 页面级路由懒加载，主包只保留主菜单"
```

---

### Task 14: vendor 分包 + 大 JSON 动态导入

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/shared/utils/spellDetailsResolver.ts`
- Modify: `src/features/spells/SpellLibraryDialog.tsx`（调用点改为预加载模式）
- Modify: `src/features/character/EquipmentLibraryDialog.tsx`（magicItems/adventuringGear 动态导入）

**Interfaces:**
- Produces:
  ```ts
  // spellDetailsResolver.ts 新增
  export async function loadSpellDetails(): Promise<SpellDetail[]>
  // 原 sync 函数保留签名但标注 @deprecated，或改为接收 details 数组参数 —— 由调用点传入
  ```

- [ ] **Step 1: 配置 vendor 分包**

先查 rolldown 类型定义确认 API：`grep -rn "advancedChunks\|codeSplitting" node_modules/rolldown/dist/types/ | head -5`，然后在 `vite.config.ts` 的 `defineConfig` 中追加（API 名以类型定义为准，以下为 rolldown advancedChunks 形态）：

```ts
build: {
  rolldownOptions: {
    output: {
      advancedChunks: {
        groups: [
          { name: "react-vendor", test: /node_modules[\\/]+(react|react-dom|react-router-dom|scheduler)[\\/]/ },
          { name: "pdf-vendor", test: /node_modules[\\/]+(jspdf|html2canvas|dom-to-image-more)[\\/]/ },
        ],
      },
    },
  },
},
```

若 `rolldownOptions`/`advancedChunks` 类型报错，按构建警告中给出的文档 URL（https://rolldown.rs/reference/OutputOptions.codeSplitting）调整；最终验收标准是构建产物中 react/jspdf 被分到独立 chunk。

- [ ] **Step 2: spellDetailsResolver 改动态导入**

```ts
// 改前
import spellDetails from "../../../data/spellDetails.json";
const details = spellDetails as SpellDetail[];

// 改后
let cache: SpellDetail[] | null = null;
export async function loadSpellDetails(): Promise<SpellDetail[]> {
  if (!cache) {
    const module = await import("../../../data/spellDetails.json");
    cache = module.default as SpellDetail[];
  }
  return cache;
}
```

- [ ] **Step 3: SpellLibraryDialog 调用点改预加载**

```tsx
// 对话框组件内新增
const [spellDetails, setSpellDetails] = useState<SpellDetail[] | null>(null);
useEffect(() => {
  if (open && !spellDetails) {
    loadSpellDetails().then(setSpellDetails);
  }
}, [open, spellDetails]);
```

原来同步调用 `getSpellDetailByName(...)` 的位置改为：传入 `spellDetails` 数组（把 resolver 的查找函数改造成接收 details 参数的纯函数），`spellDetails` 为 null 时跳过详情填充（与旧行为中"查不到详情"的分支一致，不会报错）。

- [ ] **Step 4: EquipmentLibraryDialog 同样处理**

`magicItems`/`adventuringGear` 改为对话框打开时动态 import，加载完成前列表显示现有空态/加载态分支，不改变已加载后的渲染。

- [ ] **Step 5: 验证**

Run: `npm run build`
Expected: 构建成功；`dist/assets/` 中出现 `react-vendor`、`pdf-vendor`、`spellDetails` 等独立 chunk；无 chunk 超 500KB 警告（或仅剩可接受的单个警告）

Run: `npm run lint`
Expected: 0 问题

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "perf: vendor分包与法术详情/装备库JSON按需加载"
```

---

## 阶段五：验证与推送

### Task 15: 全量验证 + dev 冒烟测试

- [ ] **Step 1: 最终全量检查**

Run: `npm run lint && npm run build`
Expected: lint 0 问题；构建成功

Run: `ls -S dist/assets/*.js | head -5`
Expected: 最大 chunk 显著小于优化前的 1,174KB（记录数字到 commit message 或 PR 描述）

- [ ] **Step 2: dev 服务器冒烟测试**

Run: `npm run dev`（后台启动）
依次在浏览器验证：
1. 主菜单正常渲染，两个建卡入口按钮在
2. `/create` 通用建卡向导：各步骤可进入，法术选择步骤正常
3. `/profile-create` 玩家画像建卡：问卷可填写
4. `/sheet` 角色卡三页（正面/背面/法术页）渲染正常，攻击面板、装备、法术对话框可打开
5. 控制台无红色报错

（若本环境无法人工操作浏览器，用 curl 确认 dev server 200 响应 + 请用户做第 3 层人工验证。）

- [ ] **Step 3: Commit（如有修复）并汇报**

向用户报告：lint/build 状态、分包前后体积对比、冒烟测试结果，**请用户人工过一遍常用功能**。

---

### Task 16: 推送 GitHub

**前置条件：** 用户明确确认功能无回归。

- [ ] **Step 1: 推送**

Run: `git push origin main`
Expected: 推送成功

- [ ] **Step 2: 确认部署**

Run: `gh run list --limit 1`（若 gh 可用）或请用户查看 GitHub Actions 页面
Expected: Deploy to GitHub Pages 工作流触发并成功

- [ ] **Step 3: 收尾**

删除 lint 临时文件（如有），向用户给出最终总结：commits 列表、体积对比、部署地址 https://110wsr.github.io/

---

## Self-Review 记录

- **Spec 覆盖：** 阶段一→Task 1-2 ✓；阶段二五类 lint→Task 3-7 ✓；阶段三四个大文件+共享常量→Task 8-12 ✓；阶段三 PageFront 子文件划分与 spec 一致 ✓；阶段四三项→Task 13-14 ✓；验证推送→Task 15-16 ✓
- **Placeholder 扫描：** 无 TBD/TODO；所有代码步骤含实际代码或确切命令
- **类型一致性：** `AttrMap`、`AttackPanelInnerProps`、`loadSpellDetails`、`SHEET_FONT_VARIATION` 等跨任务引用的名称在产出方任务中均有定义
