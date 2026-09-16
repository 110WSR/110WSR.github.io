// ============================================================================
// 法术范围格子小图 - 解析法术描述中的"施法距离"与范围形状，
// 以战斗格子网格（1 格 = 5 尺）绘制简易范围示意图
// 交互：点击格子放置 AoE 中心 / 瞄准方向，动态显示覆盖格子与距离
// ============================================================================
import React, { useMemo, useRef, useState } from "react";

interface ParsedSpell {
  rangeFt: number | null;   // null 表示 自身/触及/特殊
  rangeSelf: boolean;
  rangeTouch: boolean;
  shape: "cone" | "sphere" | "cube" | "line" | null;
  sizeFt: number;
}

function parseSpell(description: string): ParsedSpell | null {
  if (!description) return null;
  const result: ParsedSpell = { rangeFt: null, rangeSelf: false, rangeTouch: false, shape: null, sizeFt: 0 };

  const rangeMatch = description.match(/施法距离：([^\n]+)/);
  if (rangeMatch) {
    const raw = rangeMatch[1];
    if (/自身|自己/.test(raw)) result.rangeSelf = true;
    else if (/触及|接触/.test(raw)) result.rangeTouch = true;
    const num = raw.match(/(\d+)/);
    if (num) result.rangeFt = parseInt(num[1], 10);
  } else {
    return null; // 没有距离信息就不画
  }

  // 范围形状：5尺球状 / 15尺锥状 / 10尺立方 / 30尺线状 / 20尺圆柱
  const shapeMatch = description.match(/(\d+)\s*尺?\s*(球状|锥状|立方|线状|圆柱)/);
  if (shapeMatch) {
    result.sizeFt = parseInt(shapeMatch[1], 10);
    const kind = shapeMatch[2];
    result.shape = kind === "球状" || kind === "圆柱" ? "sphere" : kind === "锥状" ? "cone" : kind === "立方" ? "cube" : "line";
  }

  return result;
}

const CELL_PX = 10;
const MAX_CELLS = 15;

type Pt = { x: number; y: number };

function norm(v: Pt): Pt {
  const l = Math.hypot(v.x, v.y);
  return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: -1 };
}

/** 点到线段距离（线状 AoE 覆盖判定） */
function segDist(p: Pt, a: Pt, b: Pt): number {
  const abx = b.x - a.x, aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  let t = len2 ? ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}

function cross(a: Pt, b: Pt, p: Pt): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/** 点是否在三角形内（锥状 AoE 覆盖判定） */
function inTriangle(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
  const d1 = cross(a, b, p), d2 = cross(b, c, p), d3 = cross(c, a, p);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** 交互后的 AoE 几何（像素坐标系） */
interface AoeGeom {
  shape: "cone" | "sphere" | "cube" | "line";
  center: Pt;      // sphere / cube 的中心
  origin: Pt;      // cone / line 的起点
  dir: Pt;         // cone / line 的方向单位向量
  lenPx: number;   // cone / line 的长度（px）
  rPx: number;     // sphere 半径 / cube 半边长 / line 半宽
}

function covers(g: AoeGeom, p: Pt): boolean {
  if (g.shape === "sphere") return Math.hypot(p.x - g.center.x, p.y - g.center.y) <= g.rPx;
  if (g.shape === "cube") return Math.abs(p.x - g.center.x) <= g.rPx && Math.abs(p.y - g.center.y) <= g.rPx;
  if (g.shape === "line") {
    const end = { x: g.origin.x + g.dir.x * g.lenPx, y: g.origin.y + g.dir.y * g.lenPx };
    return segDist(p, g.origin, end) <= g.rPx;
  }
  // cone：顶点 origin，沿 dir 展开，末端半宽 = 长度一半（5E 锥形模板）
  const n = { x: -g.dir.y, y: g.dir.x };
  const w = g.lenPx / 2;
  const a = g.origin;
  const b = { x: g.origin.x + g.dir.x * g.lenPx + n.x * w, y: g.origin.y + g.dir.y * g.lenPx + n.y * w };
  const c = { x: g.origin.x + g.dir.x * g.lenPx - n.x * w, y: g.origin.y + g.dir.y * g.lenPx - n.y * w };
  return inTriangle(p, a, b, c);
}

export default function SpellRangeGrid({ description, size = 110 }: { description: string; size?: number }) {
  const parsed = parseSpell(description);
  const [point, setPoint] = useState<Pt | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { rangeFt, rangeSelf, rangeTouch, shape, sizeFt } = parsed ?? {
    rangeFt: null, rangeSelf: false, rangeTouch: false, shape: null, sizeFt: 0,
  };
  const ranged = !rangeSelf && !rangeTouch && rangeFt != null;

  // 需要的总跨度（尺）：射程 + 范围尺寸（若有）
  const spanFt = Math.max(
    rangeSelf || rangeTouch ? (shape ? sizeFt : 10) : 0,
    rangeFt ?? 0,
    (rangeFt ?? 0) + (shape === "line" || shape === "cone" ? sizeFt : 0)
  );

  // 自适应格子尺度：保证格子数不超过 MAX_CELLS
  let cellFt = 5;
  while (spanFt / cellFt > MAX_CELLS && cellFt < 30) cellFt += 5;
  const cells = Math.max(3, Math.ceil(spanFt / cellFt) + (shape ? Math.ceil(sizeFt / cellFt) : 1));
  const S = cells * CELL_PX;
  const cx = S / 2;
  const cy = S / 2;

  const toPx = (ft: number) => (ft / cellFt) * CELL_PX;

  // 射程圆
  const rangeR = rangeSelf ? 0 : rangeTouch ? toPx(5) : rangeFt != null ? toPx(rangeFt) : 0;

  // ---------- 点击后的 AoE 几何 ----------
  const caster: Pt = { x: cx, y: cy };
  const aoe: AoeGeom | null = useMemo(() => {
    if (!point || !shape) return null;
    if (shape === "sphere" || shape === "cube") {
      // 自身/触及为中心型：AoE 固定在施法者身上，点击仅测量
      if (!ranged) return null;
      return { shape, center: point, origin: point, dir: { x: 0, y: -1 }, lenPx: 0, rPx: toPx(sizeFt) / 2 };
    }
    // cone / line： ranged → 点击点为起点，方向背离施法者；自身 → 起点为施法者，指向点击方向
    const origin = ranged ? point : caster;
    const dir = norm({ x: point.x - caster.x, y: point.y - caster.y });
    return { shape, center: point, origin, dir, lenPx: toPx(sizeFt), rPx: shape === "line" ? toPx(2.5) : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point, shape, sizeFt, ranged, cx, cy, cellFt]);

  // 覆盖的格子
  const coveredCells = useMemo(() => {
    if (!parsed || spanFt <= 0 || !aoe) return [];
    const list: { col: number; row: number }[] = [];
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const p = { x: c * CELL_PX + CELL_PX / 2, y: r * CELL_PX + CELL_PX / 2 };
        if (covers(aoe, p)) list.push({ col: c, row: r });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aoe, cells]);

  if (!parsed || spanFt <= 0) return null;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(S - 2, Math.max(2, ((e.clientX - rect.left) / rect.width) * S));
    const y = Math.min(S - 2, Math.max(2, ((e.clientY - rect.top) / rect.height) * S));
    setPoint({ x, y });
  };

  // ---------- 默认（未点击）静态渲染 ----------
  const aoeDist = rangeSelf || rangeTouch || rangeFt == null ? 0 : toPx(rangeFt);
  const defaultAoeCy = cy - aoeDist;
  const fill = { fill: "rgba(217,119,6,0.35)", stroke: "#b45309", strokeWidth: 1 };
  let defaultAoeEl: React.ReactNode = null;
  if (shape && !point) {
    const s = toPx(sizeFt);
    if (shape === "sphere") {
      defaultAoeEl = <circle cx={cx} cy={defaultAoeCy} r={Math.max(toPx(2.5), s / 2)} {...fill} />;
    } else if (shape === "cube") {
      defaultAoeEl = <rect x={cx - s / 2} y={defaultAoeCy - s / 2} width={s} height={s} {...fill} />;
    } else if (shape === "line") {
      defaultAoeEl = <rect x={cx - toPx(2.5)} y={defaultAoeCy - s} width={toPx(5)} height={s} {...fill} />;
    } else if (shape === "cone") {
      const originY = aoeDist > 0 ? defaultAoeCy : cy;
      defaultAoeEl = <polygon points={`${cx},${originY} ${cx - s / 2},${originY - s} ${cx + s / 2},${originY - s}`} {...fill} />;
    }
  }

  // ---------- 点击后的 AoE 渲染 ----------
  let aoeEl: React.ReactNode = null;
  let aimLine: React.ReactNode = null;
  if (point) {
    if (aoe) {
      if (aoe.shape === "sphere") {
        aoeEl = <circle cx={aoe.center.x} cy={aoe.center.y} r={aoe.rPx} {...fill} />;
      } else if (aoe.shape === "cube") {
        aoeEl = <rect x={aoe.center.x - aoe.rPx} y={aoe.center.y - aoe.rPx} width={aoe.rPx * 2} height={aoe.rPx * 2} {...fill} />;
      } else if (aoe.shape === "line") {
        const n = { x: -aoe.dir.y, y: aoe.dir.x };
        const o = aoe.origin, d = aoe.dir, L = aoe.lenPx, w = aoe.rPx;
        aoeEl = (
          <polygon
            points={`${o.x + n.x * w},${o.y + n.y * w} ${o.x + d.x * L + n.x * w},${o.y + d.y * L + n.y * w} ${o.x + d.x * L - n.x * w},${o.y + d.y * L - n.y * w} ${o.x - n.x * w},${o.y - n.y * w}`}
            {...fill}
          />
        );
      } else if (aoe.shape === "cone") {
        const n = { x: -aoe.dir.y, y: aoe.dir.x };
        const o = aoe.origin, d = aoe.dir, L = aoe.lenPx, w = L / 2;
        aoeEl = (
          <polygon
            points={`${o.x},${o.y} ${o.x + d.x * L + n.x * w},${o.y + d.y * L + n.y * w} ${o.x + d.x * L - n.x * w},${o.y + d.y * L - n.y * w}`}
            {...fill}
          />
        );
      }
      // 瞄准方向线（cone/line：从起点指向方向）
      if (aoe.shape === "cone" || aoe.shape === "line") {
        const ex = aoe.origin.x + aoe.dir.x * aoe.lenPx;
        const ey = aoe.origin.y + aoe.dir.y * aoe.lenPx;
        aimLine = (
          <line x1={aoe.origin.x} y1={aoe.origin.y} x2={ex} y2={ey} stroke="#92400e" strokeWidth={1.2} strokeDasharray="2 2" markerEnd="url(#srg-arrow)" />
        );
      }
    }
  }

  const gridLines: React.ReactNode[] = [];
  for (let i = 0; i <= cells; i++) {
    const p = i * CELL_PX;
    gridLines.push(<line key={"h" + i} x1={0} y1={p} x2={S} y2={p} stroke="#d6d3d1" strokeWidth={0.6} />);
    gridLines.push(<line key={"v" + i} x1={p} y1={0} x2={p} y2={S} stroke="#d6d3d1" strokeWidth={0.6} />);
  }

  const rangeLabel = rangeSelf ? "自身" : rangeTouch ? "触及" : `${rangeFt} 尺`;
  const aoeLabel = shape ? ` · ${sizeFt}尺${{ cone: "锥状", sphere: "球状", cube: "立方", line: "线状" }[shape]}` : "";

  // 底部标签：未点击 = 范围说明 + 提示；已点击 = 距离 + 覆盖格数
  let bottomLabel: string;
  if (point) {
    const distFt = Math.round((Math.hypot(point.x - caster.x, point.y - caster.y) / CELL_PX) * cellFt);
    const coverTxt = coveredCells.length > 0 ? ` · 覆盖 ${coveredCells.length} 格` : "";
    bottomLabel = `距施法者 ${distFt} 尺${coverTxt}`;
  } else {
    bottomLabel = `${rangeLabel}${aoeLabel}（1格=${cellFt}尺）· 点击放置`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${S} ${S}`}
        style={{ borderRadius: 4, background: "#fafaf9", cursor: "crosshair" }}
        onClick={handleClick}
      >
        <defs>
          <marker id="srg-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#92400e" />
          </marker>
        </defs>
        {gridLines}
        {coveredCells.map((c) => (
          <rect
            key={`c${c.col}-${c.row}`}
            x={c.col * CELL_PX + 0.5}
            y={c.row * CELL_PX + 0.5}
            width={CELL_PX - 1}
            height={CELL_PX - 1}
            rx={1.5}
            fill="rgba(217,119,6,0.45)"
          />
        ))}
        {rangeR > 0 && (
          <circle cx={cx} cy={cy} r={rangeR} fill="rgba(180,83,9,0.08)" stroke="#b45309" strokeWidth={1} strokeDasharray="3 2" />
        )}
        {point ? aoeEl : defaultAoeEl}
        {aimLine}
        {/* 测量线（点击点到施法者） */}
        {point && !aoe && (
          <line x1={caster.x} y1={caster.y} x2={point.x} y2={point.y} stroke="#92400e" strokeWidth={1} strokeDasharray="2 2" />
        )}
        {/* 点击标记 */}
        {point && <circle cx={point.x} cy={point.y} r={2.5} fill="#b45309" stroke="#fff" strokeWidth={1} />}
        {/* 施法者 */}
        <circle cx={cx} cy={cy} r={3} fill="#78350f" />
      </svg>
      <span style={{ fontSize: 9, color: "#78716c", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
        {bottomLabel}
        {point && (
          <span
            role="button"
            title="重置"
            style={{ cursor: "pointer", color: "#b45309", fontSize: 10, lineHeight: 1 }}
            onClick={(e) => { e.stopPropagation(); setPoint(null); }}
          >
            ↺
          </span>
        )}
      </span>
    </div>
  );
}
