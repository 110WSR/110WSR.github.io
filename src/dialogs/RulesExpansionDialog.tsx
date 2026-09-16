import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  getExpansions,
  getEnabledExpansions,
  setExpansionEnabled,
  subscribeExpansions,
  getRuleset,
  setRuleset,
  type Ruleset,
} from "../shared/utils/rulesService";

interface RulesExpansionDialogProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_META = [
  { key: "core", title: "核心规则", hint: "始终开启" },
  { key: "official", title: "官方扩充", hint: "WotC 正式出版物内容" },
  { key: "thirdparty", title: "第三方内容", hint: "非官方资料，请与DM确认" },
] as const;

/** 基础规则集卡片定义（名称与要点取自 DND车卡大师的“先选规则版本”界面） */
const RULESET_CARDS: Array<{
  id: Ruleset;
  name: string;
  summary: string;
  detail: string;
}> = [
  {
    id: "5r2024",
    name: "5R · 2024 新规",
    summary: "背景属性加值 · 起源专长 · 武器精通",
    detail: "使用 2024 版《玩家手册》：10 个物种、16 个背景，属性加值来自背景",
  },
  {
    id: "5e2014",
    name: "5E · 2014 经典",
    summary: "种族属性加值 · 经典子职 · 旧版法术规则",
    detail: "使用 2014 版《玩家手册》：9 个经典种族、12 个经典背景，属性加值来自种族",
  },
];

export default function RulesExpansionDialog({ open, onClose }: RulesExpansionDialogProps) {
  const [enabled, setEnabled] = useState<string[]>(getEnabledExpansions());
  const [ruleset, setRulesetState] = useState<Ruleset>(getRuleset());
  const [pendingRuleset, setPendingRuleset] = useState<Ruleset | null>(null);

  useEffect(() => {
    if (!open) return;
    setEnabled(getEnabledExpansions());
    setRulesetState(getRuleset());
    setPendingRuleset(null);
    return subscribeExpansions(() => {
      setEnabled(getEnabledExpansions());
      setRulesetState(getRuleset());
    });
  }, [open]);

  if (!open) return null;

  const expansions = getExpansions();
  const is2014 = ruleset === "5e2014";

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-[520px] max-w-[92vw] max-h-[80vh] flex flex-col rounded-xl border border-stone-600/50 shadow-2xl"
        style={{ backgroundColor: "#292524" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700/50 flex-shrink-0">
          <div>
            <h2 className="text-stone-100 text-lg font-semibold tracking-wider">规则与扩充</h2>
            <p className="text-stone-500 text-xs mt-0.5">
              先定规则版本，再勾选要启用的扩展内容。默认只用核心规则书；所有扩展均默认关闭。
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors text-xl leading-none px-2"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* 基础规则选择（5E / 5R） */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-amber-200/90 text-sm font-semibold tracking-wider">基础规则</h3>
              <span className="text-stone-600 text-[11px]">随机出卡与手动车卡都会严格使用选中的规则</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RULESET_CARDS.map((card) => {
                const selected = ruleset === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => !selected && setPendingRuleset(card.id)}
                    className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      selected
                        ? "border-amber-600/60 bg-amber-900/20"
                        : "border-stone-700/40 bg-stone-800/30 hover:bg-stone-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                          selected ? "border-amber-500" : "border-stone-600"
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                      </span>
                      <span className={`text-sm font-semibold ${selected ? "text-amber-200" : "text-stone-300"}`}>
                        {card.name}
                      </span>
                    </div>
                    <div className="text-stone-400 text-[11px] mt-1 ml-6">{card.summary}</div>
                    <div className="text-stone-600 text-[11px] mt-0.5 ml-6 leading-relaxed">{card.detail}</div>
                  </button>
                );
              })}
            </div>

            {/* 切换规则集确认条 */}
            {pendingRuleset && (
              <div className="mt-2 px-3 py-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40">
                <p className="text-amber-200/90 text-xs leading-relaxed">
                  切换到「{RULESET_CARDS.find((c) => c.id === pendingRuleset)?.name}」会清空已选扩展书；
                  正在创建的角色若包含另一套规则的专属种族/背景，需重新选择。确定切换？
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRuleset(pendingRuleset);
                      setPendingRuleset(null);
                    }}
                    className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-medium transition-colors"
                  >
                    确定切换
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingRuleset(null)}
                    className="px-3 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {SECTION_META.map((sec) => {
            const items = expansions.filter((e) => e.section === sec.key);
            if (items.length === 0) return null;
            return (
              <div key={sec.key}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-amber-200/90 text-sm font-semibold tracking-wider">
                    {sec.title}
                  </h3>
                  <span className="text-stone-600 text-[11px]">{sec.hint}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((exp) => {
                    const locked = exp.id === "phb2024";
                    const isOn = locked || enabled.includes(exp.id);
                    // 5E(2014) 模式下核心规则书显示为 2014 版玩家手册
                    const displayName = locked && is2014 ? "玩家手册（PHB 2014）" : exp.name;
                    const displayNameEn = locked && is2014 ? "Player's Handbook (2014)" : exp.nameEn;
                    return (
                      <label
                        key={exp.id}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                          isOn
                            ? "border-amber-700/40 bg-amber-900/10"
                            : "border-stone-700/40 bg-stone-800/30 hover:bg-stone-800/60"
                        } ${locked ? "opacity-90" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isOn}
                          disabled={locked}
                          onChange={(e) => setExpansionEnabled(exp.id, e.target.checked)}
                          className="mt-0.5 accent-amber-600 w-4 h-4 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-stone-200 text-sm font-medium">
                            {displayName}
                            {displayNameEn && (
                              <span className="text-stone-500 text-xs ml-2 font-normal">
                                {displayNameEn}
                              </span>
                            )}
                          </div>
                          {exp.desc && (
                            <div className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                              {exp.desc}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p className="text-stone-600 text-[11px] leading-relaxed">
            基础规则决定建卡时的种族（5E）/ 物种（5R）与背景列表、属性加值来源（5E 种族加值 / 5R
            背景加值）；扩充内容会影响建卡选项与特性描述库。已创建并保存的角色不受开关影响；
            规则与开关保存在本机，网页版与桌面版各自独立。
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
