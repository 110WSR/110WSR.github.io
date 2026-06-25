# D&D 5e 角色构建器 — 项目日志

> 基于 D&D 5e 玩家手册的非官方角色构建工具  
> 技术栈：React 19 + TypeScript + Vite + Tailwind CSS v4  
> 部署：GitHub Pages / Netlify

---

## 一、项目架构

### 1.1 目录结构

```
f:\5ednd/
├── data/                          # 静态数据文件（JSON）
│   ├── classData.json             # 职业数据（生命骰、法术位等）
│   ├── classIdentifiers.json      # 职业标识符映射
│   ├── subclassData.json          # 子职数据
│   ├── subclasses/                # 各职业子职详细数据
│   ├── spellData.json             # 法术数据
│   ├── weaponPresets.json         # 武器预设
│   ├── weapons.json               # 武器数据
│   ├── armor.json                 # 护甲数据
│   ├── armorOptions.ts            # 护甲选项
│   ├── magicItems.json            # 魔法物品（971件）
│   ├── adventuringGear.json       # 冒险装备
│   ├── damageTypes.json           # 伤害类型
│   ├── languages.json             # 语言
│   ├── tools.json                 # 工具
│   ├── traitKeywords.json         # 特性关键词
│   └── traitTagPresets.json       # 特性标签预设
│
├── src/
│   ├── App.tsx                    # 根组件（路由配置）
│   ├── main.tsx                   # 入口文件
│   ├── index.css                  # 全局样式 + Tailwind
│   │
│   ├── pages/                     # 页面级组件
│   │   ├── MainMenu.tsx           # 主菜单（开始页面）
│   │   ├── CharacterCreator.tsx   # 角色创建向导
│   │   ├── CharacterSheetPage.tsx # 角色卡面板（整合页）
│   │   ├── HPRollPanel.tsx        # 生命值投掷面板
│   │   ├── PageFront.tsx          # 角色卡正面
│   │   ├── PageBack.tsx           # 角色卡背面
│   │   ├── PageSpell.tsx          # 法术页
│   │   └── creator/               # 创建向导子组件
│   │       ├── BasicInfoForm.tsx
│   │       ├── MethodSelector.tsx
│   │       ├── PointBuyPanel.tsx
│   │       ├── RandomRollPanel.tsx
│   │       ├── RecommendedPanel.tsx
│   │       ├── ManualInputPanel.tsx
│   │       ├── AttributeInput.tsx
│   │       ├── SkillSelectionPanel.tsx
│   │       ├── SubclassSelectionPanel.tsx
│   │       ├── SpellSelectionPanel.tsx
│   │       ├── EquipmentSelectionPanel.tsx
│   │       ├── CharacterDetailsPanel.tsx
│   │       ├── StepIndicator.tsx
│   │       └── types.ts
│   │
│   ├── features/                  # 功能组件
│   │   ├── character/             # 角色卡功能
│   │   │   ├── AttributeComponent.tsx
│   │   │   ├── AttackPanel.tsx
│   │   │   ├── AttackContextMenu.tsx
│   │   │   ├── BasicInfo.tsx
│   │   │   ├── CharacterName.tsx
│   │   │   ├── CoinComponent.tsx
│   │   │   ├── CombatStatBox.tsx
│   │   │   ├── DeathSaveComponent.tsx
│   │   │   ├── DiceRoller.tsx
│   │   │   ├── EquipmentPanel.tsx
│   │   │   ├── EquipmentLibraryDialog.tsx
│   │   │   ├── ItemDialog.tsx
│   │   │   ├── ItemTooltip.tsx
│   │   │   ├── LevelDisplay.tsx
│   │   │   ├── PassivePerception.tsx
│   │   │   ├── PersonalityTraitComponent.tsx
│   │   │   ├── ProficiencyBonusComponent.tsx
│   │   │   ├── ProficiencyPanel.tsx
│   │   │   ├── SavingThrowComponent.tsx
│   │   │   ├── SavingThrowPanel.tsx
│   │   │   ├── SkillButtonComponent.tsx
│   │   │   ├── SkillComponent.tsx
│   │   │   ├── SkillPanel.tsx
│   │   │   ├── TraitDialog.tsx
│   │   │   ├── TraitsPanel.tsx
│   │   │   ├── TraitTooltip.tsx
│   │   │   ├── WeaponComponent.tsx
│   │   │   ├── WeaponTip.tsx
│   │   │   └── weapons/types.ts
│   │   │
│   │   ├── spells/                # 法术功能
│   │   │   ├── SpellBox.tsx
│   │   │   ├── SpellDialog.tsx
│   │   │   ├── SpellLibraryDialog.tsx
│   │   │   ├── SpellTip.tsx
│   │   │   ├── SpellTooltip.tsx
│   │   │   ├── SlotIndicator.tsx
│   │   │   ├── Cantrip.tsx
│   │   │   └── Header.tsx
│   │   │
│   │   └── back-info/             # 角色背景信息
│   │       ├── HeaderSection.tsx
│   │       ├── CharacterInfoSection.tsx
│   │       ├── CharacterInfoField.tsx
│   │       ├── AppearanceSection.tsx
│   │       ├── BackgroundStorySection.tsx
│   │       ├── AdventureLogSection.tsx
│   │       ├── InventorySection.tsx
│   │       ├── EmblemSection.tsx
│   │       └── DateDisplay.tsx
│   │
│   ├── dialogs/                   # 对话框组件
│   │   ├── ArchiveDialog.tsx      # 存档管理
│   │   ├── BottomToolbar.tsx      # 底部工具栏
│   │   ├── CustomItemDialog.tsx   # 自定义物品
│   │   ├── ExportImportDialog.tsx # 导出/导入
│   │   └── ExportPdfDialog.tsx    # PDF导出
│   │
│   ├── shared/                    # 共享模块
│   │   ├── storage/               # 数据持久化
│   │   │   ├── CharacterContext.tsx  # React Context
│   │   │   ├── types.ts             # 数据模型
│   │   │   ├── storageService.ts    # localStorage 服务
│   │   │   ├── exportService.ts     # 导出服务
│   │   │   ├── importService.ts     # 导入服务
│   │   │   ├── shareService.ts      # 分享服务
│   │   │   ├── customDataService.ts # 自定义数据
│   │   │   └── imageStore.ts        # 图片存储
│   │   │
│   │   ├── types/                 # 类型定义
│   │   │   ├── types.ts           # 核心类型
│   │   │   └── NewInterface.ts
│   │   │
│   │   ├── ui/                    # UI 组件
│   │   │   ├── ButtonComponent.tsx
│   │   │   ├── FunctionButton.tsx
│   │   │   ├── ScrollArea.tsx
│   │   │   ├── EditableScrollArea.tsx
│   │   │   ├── SectionContainer.tsx
│   │   │   ├── StepperButton.tsx
│   │   │   ├── MultiSelectDialog.tsx
│   │   │   └── logo.tsx
│   │   │
│   │   ├── dialogs/               # 共享对话框工具
│   │   │   ├── dialog.tsx
│   │   │   └── utils.ts
│   │   │
│   │   ├── tokens/colors.ts       # 设计令牌
│   │   └── utils/                 # 工具函数
│   │       ├── traitGenerator.ts  # 特性生成器
│   │       └── weaponResolver.ts  # 武器解析器
│   │
│   ├── styles/                    # 样式
│   │   ├── fonts.css              # 字体配置
│   │   └── theme.css              # 主题变量
│   │
│   └── assets/                    # 静态资源
│       ├── arrow.tsx
│       ├── dnd.ts
│       ├── flag.ts
│       └── star.ts
│
├── public/
│   └── 404.html                   # GitHub Pages 404 重定向
│
├── index.html                     # HTML 入口
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 依赖管理
├── netlify.toml                   # Netlify 部署配置
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD
└── PROJECT_REPORT.md              # 项目报告
```

### 1.2 路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | MainMenu | 主菜单（开始页面） |
| `/create` | CharacterCreator | 角色创建向导 |
| `/sheet` | CharacterSheetPage | 角色卡面板（三页） |
| `*` | → `/` | 默认重定向 |

使用 `HashRouter` 以兼容 GitHub Pages 静态托管。

---

## 二、数据结构

### 2.1 角色数据模型 (`CharacterData`)

```typescript
interface CharacterData {
  id: string;                    // 唯一标识
  name: string;                  // 角色名
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间

  // ── 角色卡正面 ──
  attributes: Attributes;        // 六项属性（str/dex/con/int/wis/cha）
  level: number | "";            // 等级
  proficiencyBonus: number;      // 熟练加值
  basicInfo: Record<string, string>;  // 职业/种族/背景/阵营/玩家名/经验值
  personality: Personality;      // 个性特点/理想/牵绊/缺点
  coins: Coins;                  // 金币（cp/sp/ep/gp/pp）
  equipment: string;             // 装备文本
  traits: string;                // 特性文本
  traitList: TraitItem[];        // 特性列表
  items: Item[];                 // 物品列表
  attackEntries: AttackEntry[];  // 攻击栏条目
  currentHP: number;             // 当前生命值
  customMaxHP: number | null;    // 自定义最大HP
  tempHP: number;                // 临时HP
  customAC: number | null;       // 自定义AC
  selectedArmorId: string | null;// 已选护甲
  hasShield: boolean;            // 是否持盾
  proficiencies: Proficiencies;  // 熟练项
  deathSaves: DeathSaves;        // 死亡豁免
  savingThrows: SavingThrows;    // 豁免检定
  skills: Skills;                // 技能熟练

  // ── 角色卡背面 ──
  characterInfo: CharacterInfoData;  // 角色信息
  backstory: string;             // 背景故事
  inventory: string;             // 财产
  adventureLog: string;          // 冒险日志
  date: string;                  // 日期

  // ── 法术页 ──
  spellBoxes: SpellBoxData[];    // 法术位盒子
  spells: Record<string, string[]>;  // 创建时选择的法术
  customHeights: Record<number, number>;  // 自定义盒子高度
  customSpellSlots: Record<number, number>;  // 自定义法术位
  spellcastingAbility: "int" | "wis" | "cha";  // 施法属性
  spellSaveDCExtras: ExtraBonus[];
  spellAttackExtras: ExtraBonus[];
}
```

### 2.2 核心类型

```typescript
// 六项属性
interface Attributes {
  str_value: number;
  dex_value: number;
  con_value: number;
  int_value: number;
  wis_value: number;
  cha_value: number;
}

// 法术位盒子
interface SpellBoxData {
  level: number;         // 环阶（0=戏法）
  spellCount: number;    // 法术位数量
  filledSlots: number;   // 已使用法术位
  isCantrip: boolean;    // 是否为戏法
  col: number;           // 列位置
  row: number;           // 行位置
  spells: SpellData[];   // 法术列表
}

// 法术数据
interface SpellData {
  id: string;
  name: string;
  description: string;
  isInnate: boolean;          // 天生施法
  usage?: string;             // 使用次数
  innateAbility?: "int"|"wis"|"cha";
  school?: string;            // 学派
  ritual?: boolean;           // 仪式
  concentration?: boolean;    // 专注
  prepared?: boolean;         // 已准备
  damageDice?: string;
  damageType?: string;
  attackBonus?: number;
  saveType?: "attack"|"save";
  attackDisplay?: string;
}

// 物品
interface Item {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  features: Feature[];
  isWeapon: boolean;
  damageDice?: string;
  damageType?: string;
  attackAttr?: string;
  attackBonus?: string;
  isMagic?: boolean;
  proficient?: boolean;
  tags?: string[];
  extraDamages?: ExtraDamage[];
}

// 攻击栏条目
interface AttackEntry {
  id: string;
  type: "weapon" | "spell";
  refId: string;
}

// 特性条目
interface TraitItem {
  id: string;
  name: string;
  usage?: string;
  description?: string;
  tags?: string[];
}
```

### 2.3 数据持久化

- **存储方式**：`localStorage`
- **存储键**：`dnd5e_saves`（存档列表）、`dnd5e_current`（当前角色ID）
- **存档管理**：支持多角色存档、切换、删除
- **导出/导入**：JSON 格式导出与导入
- **分享**：通过 URL 编码分享角色数据

---

## 三、实现功能

### 3.1 主菜单（开始页面）

- **创建新角色**：进入角色创建向导
- **继续编辑**：直接打开当前角色卡
- **角色卡面板**：查看/编辑已有角色
- **最近存档**：显示最近5个存档，快速加载

### 3.2 角色创建向导

分步引导创建角色，共8个步骤：

| 步骤 | 页面 | 功能 |
|------|------|------|
| 1 | 基本信息 | 填写角色名、选择职业/种族/背景/等级 |
| 2 | 选择方法 | 选择属性生成方式 |
| 3 | 确认属性 | 配置六项属性值 |
| 4 | 生命值与技能 | 投掷生命值、选择技能熟练项 |
| 5 | 选择子职 | 根据职业和等级选择子职（动态显示） |
| 6 | 选择法术 | 选择已知法术/准备法术（施法职业显示） |
| 7 | 选择装备 | 选择武器、护甲、盾牌、额外装备 |
| 8 | 角色细节 | 填写阵营、个性、背景故事 |

#### 属性生成方式（4种）

1. **官方购点法**（Standard Array / Point Buy）
   - 标准属性值：15, 14, 13, 12, 10, 8
   - 支持购点消耗计算
   - 自动应用种族属性加成

2. **随机生成**（Random Roll）
   - 4d6 取最高3个，重复6次
   - 支持重新投掷
   - 可手动微调

3. **推荐属性**（Recommended）
   - 根据职业提供推荐属性分配
   - 自动应用种族属性加成
   - 一键选择

4. **自行填数**（Manual Input）
   - 自由输入各属性值
   - 实时显示属性总和

#### 子职选择

- 根据职业和等级自动判断是否需要选择子职
- 支持12个职业的子职数据
- 子职特性自动添加到角色卡

#### 法术选择

- 根据职业和等级显示可用法术
- 支持戏法和1-9环法术
- 显示法术位数量
- 快速建卡推荐法术
- 子职额外法术自动标记

### 3.3 角色卡面板

三页角色卡，通过标签页切换：

#### 第一页 — 角色卡正面

- **属性值**：六项属性值及属性调整值
- **战斗统计**：AC、先攻、速度、HP
- **攻击栏**：武器攻击和法术攻击
- **技能**：18项技能熟练状态
- **豁免检定**：6项豁免熟练
- **特性与特质**：种族/职业/背景特性
- **装备**：物品列表、金币
- **个性特征**：个性特点、理想、牵绊、缺点

#### 第二页 — 角色卡背面

- **角色信息**：姓名、性别、年龄、身高、体重等
- **外貌描述**：眼睛、皮肤、头发颜色
- **背景故事**：角色背景
- **财产**：装备和物品清单
- **冒险日志**：冒险记录
- **徽章**：角色徽章

#### 第三页 — 法术页

- **戏法**：已知戏法列表
- **法术位**：各环法术位数量及使用情况
- **法术列表**：按环阶分组的法术
- **法术详情**：学派、仪式、专注标记
- **法术位管理**：标记已使用法术位
- **自定义法术位**：覆写法术位数量

### 3.4 特色功能

#### 掷骰器
- 悬浮在右下角的骰子按钮
- 支持各种骰子类型（d4/d6/d8/d10/d12/d20/d100）
- 可添加调整值
- 显示投掷结果和总骰面

#### 装备库
- 从装备库检索并添加装备
- 支持中文/英文搜索
- 按类别筛选（护甲、武器、药水、戒指、法杖、卷轴、奇物等）
- 971件魔法物品数据

#### 法术库
- 从法术库检索并添加法术
- 按名称搜索
- 按环阶筛选

#### 存档管理
- 多角色存档
- 存档切换
- 存档删除
- 自动保存

#### 导出/导入
- JSON 格式导出角色数据
- JSON 格式导入角色数据
- 分享链接生成

#### 自定义物品
- 创建自定义物品
- 自定义武器属性
- 自定义法术

#### 自动特性生成
- 根据职业、等级、种族、背景自动生成特性
- 子职特性自动添加
- 特性标签分类

### 3.5 响应式设计

- **桌面端**：角色卡缩放显示，完整布局
- **移动端**：自适应宽度，触控优化
- **安全区适配**：支持刘海屏/底部安全区
- **触摸优化**：增大点击区域（44px 最小尺寸）

---

## 四、技术细节

### 4.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| React Router | 7.x | 路由管理 |
| Lucide React | - | 图标库 |
| Radix UI | - | 无障碍组件 |

### 4.2 构建与部署

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

- **GitHub Pages**：通过 GitHub Actions 自动部署
- **Netlify**：通过 netlify.toml 配置部署
- **输出目录**：`dist/`

### 4.3 数据来源

- 玩家手册中文翻译：5eDnD 中文社区
- 角色卡 UI 设计：基于 [Youye39/DND5E-builder](https://github.com/Youye39/DND5E-builder)（MIT 许可证）
- 魔法物品数据：从城主指南（5e2.txt）提取
- 职业/法术数据：从结构化 JSON 文件加载

---

## 五、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | - | 初始版本：角色卡正面/背面/法术页 |
| v1.1 | - | 添加主菜单、角色创建向导 |
| v1.2 | - | 添加装备库、法术库、魔法物品 |
| v1.3 | - | 响应式适配、Bug 修复 |

---

*最后更新：2026年6月25日*