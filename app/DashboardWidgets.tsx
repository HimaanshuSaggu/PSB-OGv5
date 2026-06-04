"use client";

import { motion } from "framer-motion";

/* ---- geometry helpers for the gauge arc ---- */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/* ====================== RADIAL GAUGE ====================== */
export function RadialGauge({
  value,
  label,
  unit = "%",
  color = "var(--gold)",
}: {
  value: number;
  label: string;
  unit?: string;
  color?: string;
}) {
  const f = Math.max(0, Math.min(100, value)) / 100;
  const cx = 100,
    cy = 100,
    r = 72;
  const track = arcPath(cx, cy, r, 135, 405);
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = 135 + 270 * (i / 10);
    const [x0, y0] = polar(cx, cy, r + 11, a);
    const [x1, y1] = polar(cx, cy, r + 18, a);
    return (
      <line
        key={i}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke="var(--marble-3)"
        strokeWidth={2}
      />
    );
  });
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" className="gauge-svg">
        {ticks}
        <path
          d={track}
          fill="none"
          stroke="var(--marble-2)"
          strokeWidth={13}
          strokeLinecap="round"
        />
        <motion.path
          d={track}
          fill="none"
          stroke={color}
          strokeWidth={13}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: f }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.1, ease: EASE }}
          style={{ filter: `drop-shadow(0 0 7px ${color})` }}
        />
      </svg>
      <div className="gauge-center">
        <div className="gauge-value">
          {value}
          <span>{unit}</span>
        </div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
}

/* ====================== CONFIDENCE RING ====================== */
export function ConfidenceRing({
  value,
  label = "Confidence",
}: {
  value: number;
  label?: string;
}) {
  const f = Math.max(0, Math.min(100, value)) / 100;
  const cx = 100,
    cy = 100,
    r = 70;
  return (
    <div className="cring">
      <svg viewBox="0 0 200 200" className="cring-svg">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--marble-2)"
          strokeWidth={12}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--gold-bright)"
          strokeWidth={12}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: f }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{ filter: "drop-shadow(0 0 7px var(--gold))" }}
        />
      </svg>
      <div className="cring-center">
        <div className="cring-value">
          {value}
          <span>%</span>
        </div>
        <div className="cring-label">{label}</div>
      </div>
    </div>
  );
}

/* ====================== SPARKLINE ====================== */
export function Sparkline({
  data,
  color = "var(--aegean)",
}: {
  data: number[];
  color?: string;
}) {
  const w = 240,
    h = 56,
    pad = 6;
  const max = Math.max(...data),
    min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (w - 2 * pad) * (i / (data.length - 1));
    const y = h - pad - (h - 2 * pad) * ((v - min) / span);
    return [x, y] as const;
  });
  const d = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  const area =
    d + ` L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none">
      <path d={area} fill={color} opacity={0.1} />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      {pts.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === pts.length - 1 ? 3.5 : 0}
          fill={color}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.3 }}
        />
      ))}
    </svg>
  );
}

/* ====================== PIPELINE FLOW ====================== */
const STEPS = [
  { icon: "◉", name: "Motion", desc: "PIR triggers", color: "var(--aegean)" },
  { icon: "☁", name: "Web Server", desc: "Image uploads", color: "var(--aegean)" },
  { icon: "◆", name: "Pi 4 · Gemini", desc: "Vision analysis", color: "var(--gold)" },
  { icon: "✉", name: "Archaeologist", desc: "If threat → alert", color: "var(--crimson)" },
];

export function PipelineFlow() {
  return (
    <div className="flow">
      <div className="flow-line">
        <div className="flow-pulse" />
        <div className="flow-pulse flow-pulse-2" />
      </div>
      {STEPS.map((s, i) => (
        <motion.div
          className="flow-node"
          key={s.name}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
        >
          <div
            className="flow-dot"
            style={{ borderColor: s.color, color: s.color }}
          >
            <span>{s.icon}</span>
          </div>
          <div className="flow-name">{s.name}</div>
          <div className="flow-desc">{s.desc}</div>
        </motion.div>
      ))}
    </div>
  );
}

/* ====================== DETECTIONS-OVER-TIME GRAPH (axes) ====================== */
export function AlertsGraph({ data }: { data: number[] }) {
  const W = 820,
    H = 300,
    padL = 44,
    padR = 16,
    padT = 18,
    padB = 48;
  const n = Math.max(data.length, 2);
  const series = data.length ? data : new Array(n).fill(0);
  const maxV = Math.max(...series, 1);
  const yMax = Math.max(4, Math.ceil(maxV / 4) * 4); // multiple of 4 → clean integer ticks
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xs = (i: number) => padL + plotW * (i / (n - 1));
  const ys = (v: number) => padT + plotH * (1 - v / yMax);
  const pts = series.map((v, i) => [xs(i), ys(v)] as const);

  // dates: last point = today
  const today = new Date();
  const dates = Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
  const fmtD = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const xStep = Math.max(1, Math.ceil(n / 7));

  // smooth curve (Catmull-Rom -> bezier)
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[pts.length - 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const baseY = padT + plotH;
  const area = `${d} L ${pts[pts.length - 1][0].toFixed(1)} ${baseY} L ${pts[0][0].toFixed(1)} ${baseY} Z`;
  const total = series.reduce((a, b) => a + b, 0);
  const yTicks = [0, 1, 2, 3, 4].map((g) => (yMax * g) / 4);

  return (
    <div className="agraph-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="agraph">
        <defs>
          <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--gold)" stopOpacity="0.30" />
            <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((t, g) => {
          const y = ys(t);
          return (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--marble-2)" strokeWidth="1" />
              <text
                x={padL - 9}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--ivory-dim)"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {t}
              </text>
            </g>
          );
        })}
        {/* axes */}
        <line x1={padL} x2={padL} y1={padT} y2={baseY} stroke="var(--marble-3)" strokeWidth="1" />
        <line x1={padL} x2={W - padR} y1={baseY} y2={baseY} stroke="var(--marble-3)" strokeWidth="1" />

        {/* X labels (dates) */}
        {dates.map((dt, i) =>
          i % xStep === 0 || i === n - 1 ? (
            <text
              key={i}
              x={xs(i)}
              y={baseY + 18}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--ivory-dim)"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {fmtD(dt)}
            </text>
          ) : null
        )}
        {/* axis titles */}
        <text
          x={padL - 30}
          y={padT + plotH / 2}
          textAnchor="middle"
          fontSize="9"
          fill="var(--gold)"
          transform={`rotate(-90 ${padL - 30} ${padT + plotH / 2})`}
          style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.12em" }}
        >
          DETECTIONS
        </text>

        <path d={area} fill="url(#agrad)" />
        <motion.path
          d={d}
          fill="none"
          stroke="var(--gold-bright)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--gold-bright)" />
        ))}
      </svg>
      <div className="agraph-foot">
        <span>{total === 0 ? "No detections in the last 14 days" : `${total} detections · last ${n} days`}</span>
      </div>
    </div>
  );
}
