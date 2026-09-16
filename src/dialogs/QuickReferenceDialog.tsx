// ============================================================================
// 规则速查对话框 - 资深玩家快速查规则
// 检索（法术/规则词条/异常状态）· 战斗轮讲解 · 小知识 · 换算（距离/金钱/负重）
// 数据来源：data/rules2024.json、data/spellDetails.json、data/carddy 状态表
// ============================================================================
import { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import rulesData from "../../data/rules2024.json";
import spellDetails from "../../data/spellDetails.json";
import conditionsData from "../../data/carddy/5r2024/phb2024/conditions.json";
import SpellRangeGrid from "../features/spells/SpellRangeGrid";

type TabKey = "search" | "combat" | "tips" | "convert";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "search", label: "🔍 检索" },
  { key: "combat", label: "⚔️ 战斗轮" },
  { key: "tips", label: "💡 小知识" },
  { key: "convert", label: "📐 换算" },
];

// ── 检索索引 ────────────────────────────────────────────────────────────────
interface Entry {
  kind: "法术" | "规则" | "状态";
  title: string;
  meta: string;
  text: string;
}

let indexCache: Entry[] | null = null;
function buildIndex(): Entry[] {
  if (indexCache) return indexCache;
  const entries: Entry[] = [];
  for (const s of spellDetails as Array<Record<string, string>>) {
    entries.push({
      kind: "法术",
      title: s["名称（中）"],
      meta: `${s["环阶与学派"]} · ${s["施法时间"]}`,
      text: `施法时间：${s["施法时间"]}\n施法距离：${s["施法距离"]}\n法术成分：${s["法术成分"]}\n持续时间：${s["持续时间"]}\n\n${s["描述"]}`,
    });
  }
  const rules = rulesData as {
    core: { traits: Record<string, Array<{ source: string; text: string }>> };
    expansionsData: Record<string, { traits: Record<string, Array<{ source: string; text: string }>> }>;
  };
  const addTraits = (db: Record<string, Array<{ source: string; text: string }>>, prefix: string) => {
    for (const [name, infos] of Object.entries(db)) {
      if (entries.some((e) => e.kind === "规则" && e.title === name)) continue;
      const info = infos[0];
      entries.push({ kind: "规则", title: name, meta: prefix + (info?.source ?? ""), text: infos.map((i) => i.text).join("\n\n———\n\n") });
    }
  };
  addTraits(rules.core.traits, "");
  for (const exp of Object.values(rules.expansionsData)) addTraits(exp.traits, "");
  for (const c of conditionsData as Array<{ name: string; name_en: string; desc: string }>) {
    entries.push({ kind: "状态", title: c.name, meta: c.name_en, text: c.desc });
  }
  indexCache = entries;
  return entries;
}

const KIND_COLOR: Record<Entry["kind"], string> = {
  法术: "bg-blue-100 text-blue-700",
  规则: "bg-amber-100 text-amber-700",
  状态: "bg-red-100 text-red-600",
};

function SearchTab() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const entries = buildIndex();
    const titleHits: Entry[] = [];
    const textHits: Entry[] = [];
    for (const e of entries) {
      if (e.title.includes(q)) titleHits.push(e);
      else if (e.text.includes(q) || e.meta.includes(q)) textHits.push(e);
    }
    return [...titleHits, ...textHits].slice(0, 40);
  }, [query]);

  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入关键词：法术名 / 特性名 / 状态名，或规则原文中的词…"
        className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-200 text-sm outline-none focus:border-amber-600/50"
      />
      {!query.trim() && (
        <p className="text-stone-500 text-xs leading-relaxed">
          共收录 {buildIndex().length} 个条目（{spellDetails.length} 个法术 · 500+ 规则词条 ·{" "}
          {conditionsData.length} 种异常状态），全部来自 2024 版核心数据集。
        </p>
      )}
      {query.trim() && results.length === 0 && <p className="text-stone-500 text-sm py-6 text-center">没有找到相关条目</p>}
      <div className="space-y-1.5 max-h-[46vh] overflow-y-auto pr-1">
        {results.map((r, i) => {
          const key = r.kind + r.title + i;
          const open = expanded === key;
          return (
            <div key={key} className="rounded-lg border border-stone-700/50 bg-stone-800/40 overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-stone-800/70 transition-colors"
                onClick={() => setExpanded(open ? null : key)}
              >
                <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${KIND_COLOR[r.kind]}`}>{r.kind}</span>
                <span className="text-stone-200 text-sm font-medium truncate">{r.title}</span>
                <span className="text-stone-500 text-[11px] truncate ml-auto flex-shrink-0">{r.meta}</span>
              </button>
              {open && (
                <div className="px-3 pb-3 pt-1 border-t border-stone-700/40">
                  <div className="flex gap-3 items-start">
                    <div className="text-stone-300 text-xs leading-relaxed whitespace-pre-wrap flex-1 min-w-0">
                      {r.text}
                    </div>
                    {r.kind === "法术" && <SpellRangeGrid description={r.text} size={120} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 战斗轮讲解 ──────────────────────────────────────────────────────────────
function CombatTab() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h4 className="text-amber-200/90 text-sm font-semibold mb-1.5">{title}</h4>
      <div className="text-stone-300 text-xs leading-relaxed space-y-1">{children}</div>
    </div>
  );
  const Li = ({ k, v }: { k: string; v: string }) => (
    <p>
      <span className="text-stone-100 font-medium">· {k}：</span>
      {v}
    </p>
  );
  return (
    <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
      <Section title="一回合能做什么（自己回合）">
        <Li k="移动" v="速度内自由移动，可拆分、可穿插在动作之间；攀爬游泳算困难地形。" />
        <Li k="动作" v="每回合 1 个，是战斗核心（见下方动作列表）。" />
        <Li k="附赠动作" v="只有当特性/法术/物品明确给附赠动作时才有，每回合最多 1 个（如野蛮人狂暴、诗人激励、副手攻击）。" />
        <Li k="交互" v="回合内可顺手做 1 次小交互（拔武器、开门、掏药水），第 2 次要消耗动作。" />
      </Section>
      <Section title="常见动作（2024 规则）">
        <Li k="攻击" v="武器/徒手攻击一次；可用武器精通属性（推离/擦掠/失衡等）。" />
        <Li k="魔法" v="施放施法时间为 1 动作的法术。" />
        <Li k="疾走" v="本回合移动速度翻倍。" />
        <Li k="撤离" v="本回合移动不引发借机攻击。" />
        <Li k="闪避" v="攻击检定对你有劣势，敏捷豁免具有优势。" />
        <Li k="躲藏" v="躲藏检定，成功后攻击有优势。" />
        <Li k="利用" v="使用道具/给队友药水等巧劲操作。" />
        <Li k="备战" v="本回合做准备，用反应触发预定动作（先设定触发条件）。" />
        <Li k="搜索/学习/影响" v="侦察、回忆知识、社交尝试各成动作。" />
      </Section>
      <Section title="反应（每轮 1 次，回合外使用）">
        <Li k="典型用法" v="借机攻击（敌人离开你触及）、反制法术、羽落术、护盾术等。" />
        <Li k="刷新" v="到自己的回合开始时恢复。" />
      </Section>
      <Section title="战斗流程速记">
        <p>① 掷先攻（d20+敏捷调整值）→ ② 从高到低轮流行动 → ③ 每人：移动 + 动作（+附赠动作）→ ④ 意外情况用反应 → ⑤ 一轮结束，重复直到一方倒地/撤退。</p>
      </Section>
    </div>
  );
}

// ── 小知识（过场提示式）─────────────────────────────────────────────────────
const TIPS = [
  "优势与劣势不能叠加：有任何一个劣势，所有优势全部抵消，反之亦然，最终只掷一次 d20。",
  "自然 20 必定命中，且伤害骰翻倍（掷两次取总和）；自然 1 必定失手。",
  "专注同一时间只能维持 1 个法术；受伤要过体质豁免（DC 10 或伤害一半，取高），失败则专注中断。",
  "短休 1 小时：可消耗生命骰回复生命值；长休 8 小时：回满生命值并恢复全部生命骰。",
  "跌落伤害：每 10 尺 1d6，最多 20d6；掉到水里最后 20 尺不算伤害（2024 规则）。",
  "黑暗视觉让你在黑暗里视物如微光——只有灰度，且在真正的魔法黑暗中无效。",
  "徒手打击是武器攻击，可以触发武器精通属性（如推离、擦掠）。",
  "处于倒地状态时：近战攻击打你有优势、远程攻击打你有劣势；起身要消耗一半移动力。",
  "目标有半掩护 +2 AC、四分之三掩护 +5 AC、全身掩护无法被直接指定。",
  "法术的豁免 DC = 8 + 熟练加值 + 施法属性调整值；法术攻击 = d20 + 熟练加值 + 施法属性调整值。",
  "多职业时，法术位按所有施法职业等级合计后的表格计算（兼职施法表）。",
  "灵感（英雄激励）可以重掷一次属性检定/攻击/豁免——别忘用！2024 长休后清零。",
  "武器熟练不加伤害，只把熟练加值加到攻击检定上；不熟练的武器照样能砍，只是打不准。",
  "治疗药水自己喝是附赠动作，喂给别人是动作。",
  "法术成分里的姿势手势需要空手；持盾+武器时很多法术就放不出来了。",
  "察觉是被动触发的（被动察觉 = 10 + 察觉加值），DM 常直接用它代替玩家声明'我搜一下'。",
  "负重超过 携带上限（力量×15 磅）会减速；推拉举上限是力量×30 磅。",
  "2024 规则里'邪术师'改名'魔契师'，'种族'改名'物种'，背景提供属性加值而不是种族。",
];

function TipsTab() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  return (
    <div className="py-8 px-4 text-center space-y-6">
      <p className="text-stone-200 text-base leading-relaxed font-medium">💡 {TIPS[idx]}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIdx((idx + 1) % TIPS.length)}
          className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-medium rounded-md transition-colors"
        >
          换一条
        </button>
        <span className="text-stone-600 text-[11px]">
          {idx + 1} / {TIPS.length}
        </span>
      </div>
    </div>
  );
}

// ── 换算 ────────────────────────────────────────────────────────────────────
function ConvertTab() {
  const [ft, setFt] = useState("30");
  const [gp, setGp] = useState("1");
  const [str, setStr] = useState("10");
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-lg border border-stone-700/50 bg-stone-800/40 p-3">
      <h4 className="text-amber-200/90 text-sm font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
  const num = (s: string) => (isNaN(parseFloat(s)) ? 0 : parseFloat(s));
  const carry = Math.floor(num(str)) * 15;
  const pushLift = Math.floor(num(str)) * 30;
  const SPEED_TABLE = [
    ["5 尺 / 1 格", "1.5 米"],
    ["10 尺 / 2 格", "3 米"],
    ["15 尺 / 3 格", "4.5 米"],
    ["30 尺 / 6 格", "9 米（人类标准速度）"],
    ["60 尺 / 12 格", "18 米"],
    ["100 尺", "30 米"],
    ["1 英里", "约 1.6 公里"],
  ];
  const COIN_TABLE = [
    ["1 铂金币 (pp)", "10 金币", "100 银 = 1000 铜"],
    ["1 金币 (gp)", "10 银 (sp)", "100 铜 (cp)"],
    ["常见物价", "长剑 15gp / 皮甲 10gp / 治疗药水 50gp / 平民一日生活 1~2sp", ""],
  ];
  return (
    <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1 text-stone-300 text-xs">
      <Section title="距离换算（1 尺 ≈ 0.3 米 · 1 格 = 5 尺）">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
          {SPEED_TABLE.map(([a, b]) => (
            <p key={a}>
              <span className="text-stone-100">{a}</span> = {b}
            </p>
          ))}
        </div>
        <p className="text-stone-500">
          自定义：{num(ft)} 尺 ≈ <span className="text-amber-200">{(num(ft) * 0.3048).toFixed(1)} 米</span> /{" "}
          {(num(ft) / 5).toFixed(1)} 格
        </p>
        <input value={ft} onChange={(e) => setFt(e.target.value)} placeholder="输入尺数…"
          className="mt-1 w-28 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-xs outline-none focus:border-amber-600/50" />
      </Section>
      <Section title="金钱换算（1 金 = 10 银 = 100 铜 · 1 铂 = 10 金）">
        {COIN_TABLE.map(([a, b, c]) => (
          <p key={a}>
            <span className="text-stone-100">{a}</span> = {b}
            {c ? `（${c}）` : ""}
          </p>
        ))}
        <p className="text-stone-500 mt-1">
          自定义：{num(gp)} 金币 = <span className="text-amber-200">{num(gp) * 10} 银</span> = {num(gp) * 100} 铜 ={" "}
          {num(gp) / 10} 铂
        </p>
        <input value={gp} onChange={(e) => setGp(e.target.value)} placeholder="输入金币数…"
          className="mt-1 w-28 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-xs outline-none focus:border-amber-600/50" />
      </Section>
      <Section title="负重查询（2024 规则）">
        <p>
          携带上限 = <span className="text-stone-100">力量值 × 15 磅</span>；推拉举 = 力量值 × 30 磅（超此不可移动）。
        </p>
        <p className="text-stone-500">体型：小型 ×1/2；大型 ×2（2024 规则）。</p>
        <p className="mt-1">
          力量 {num(str)}：携带 <span className="text-amber-200">{carry} 磅（约 {(carry * 0.45).toFixed(0)} 斤）</span>，推拉举 {pushLift} 磅
        </p>
        <input value={str} onChange={(e) => setStr(e.target.value)} placeholder="输入力量值…"
          className="mt-1 w-28 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-xs outline-none focus:border-amber-600/50" />
      </Section>
    </div>
  );
}

// ── 主对话框 ────────────────────────────────────────────────────────────────
export default function QuickReferenceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>("search");

  useEffect(() => {
    if (open) setTab("search");
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[680px] max-w-[94vw] max-h-[85vh] flex flex-col rounded-xl border border-stone-600/50 shadow-2xl bg-stone-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-700/50 flex-shrink-0">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  tab === t.key ? "bg-amber-700/60 text-amber-100 font-medium" : "text-stone-400 hover:text-stone-200 hover:bg-stone-700/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors text-xl leading-none px-2" aria-label="关闭">
            ×
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">
          {tab === "search" && <SearchTab />}
          {tab === "combat" && <CombatTab />}
          {tab === "tips" && <TipsTab />}
          {tab === "convert" && <ConvertTab />}
        </div>
      </div>
    </div>,
    document.body
  );
}
