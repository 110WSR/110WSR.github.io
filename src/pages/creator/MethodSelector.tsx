import type { AttributeMethod } from "./types";

export default function MethodSelector({ method, onMethodChange }: { method: AttributeMethod; onMethodChange: (m: AttributeMethod) => void }) {
  const methods: { value: AttributeMethod; label: string; desc: string }[] = [
    { value: "standard", label: "官方购点法", desc: "27点购点，属性范围8-15" },
    { value: "random", label: "随机生成", desc: "4d6取最高3个，可重新投掷" },
    { value: "recommended", label: "推荐属性", desc: "按职业选择推荐配置" },
    { value: "manual", label: "自行填数", desc: "自由填写3-18" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {methods.map((m) => (
        <button key={m.value} onClick={() => onMethodChange(m.value)} className={"p-3 rounded-lg border text-left transition-all duration-200 " + (method === m.value ? "bg-amber-900/30 border-amber-600/50 shadow-lg shadow-amber-900/20" : "bg-stone-800/30 border-stone-700/50 hover:border-stone-600/50 hover:bg-stone-700/30")}>
          <div className={"text-sm font-semibold mb-1 " + (method === m.value ? "text-amber-300" : "text-stone-300")}>{m.label}</div>
          <div className="text-xs text-stone-500">{m.desc}</div>
        </button>
      ))}
    </div>
  );
}