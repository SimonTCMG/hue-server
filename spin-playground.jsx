import { useState, useEffect, useRef } from "react";

const COLORS = {
  spark: "#D92010",
  glow:  "#F5D000",
  root:  "#1A8C4E",
  flow:  "#1755B8",
  ink:   "#1A1410",
  cream: "#FDFAF4",
  sand:  "#E8DFC8",
  stone: "#9B8E7E",
};

const dots = [
  { id: "spark", color: COLORS.spark },
  { id: "glow",  color: COLORS.glow  },
  { id: "root",  color: COLORS.root  },
  { id: "flow",  color: COLORS.flow  },
];

// ─── Spinning mark ─────────────────────────────────────────────────────────────
function SpinMark({
  size = 120,
  speed = 6,          // seconds per revolution
  direction = 1,      // 1 = clockwise, -1 = counter
  dotScale = 1,       // dot size multiplier
  spread = 0.32,      // how far dots are from centre (fraction of size)
  showH = true,
  paused = false,
  variant = "light",  // "light" | "dark" | "float"
}) {
  const angleRef = useRef(0);
  const rafRef   = useRef(null);
  const svgRef   = useRef(null);
  const lastRef  = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = ts - lastRef.current;
      lastRef.current = ts;
      if (!paused) angleRef.current += (dt / 1000) * (360 / speed) * direction;
      if (svgRef.current) {
        const g = svgRef.current.querySelector(".spinning-group");
        if (g) g.setAttribute("transform", `rotate(${angleRef.current} ${size/2} ${size/2})`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, direction, paused, size]);

  const cx   = size / 2;
  const cy   = size / 2;
  const r    = size * spread;
  const dotR = size * 0.158 * dotScale;
  const bgFill = variant === "dark" ? COLORS.ink : variant === "float" ? "transparent" : "#fff";
  const hFill  = variant === "dark" ? COLORS.cream : COLORS.ink;
  const hW = size * 0.32;
  const hH = size * 0.30;
  const sw = size * 0.055;
  const cbH = size * 0.055;
  const hx = cx - hW / 2;
  const hy = cy - hH / 2;

  // Dot positions at 45°, 135°, 225°, 315° (so they start in quadrant centres)
  const angles = [315, 45, 135, 225]; // TL, TR, BR, BL in clockwise order

  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block" }}>
      {/* Background */}
      {variant === "light" && <circle cx={cx} cy={cy} r={size * 0.48} fill="#fff" />}
      {variant === "dark"  && <circle cx={cx} cy={cy} r={size * 0.48} fill={COLORS.ink} />}

      {/* Spinning dots group */}
      <g className="spinning-group">
        {dots.map((d, i) => {
          const a = (angles[i] * Math.PI) / 180;
          return (
            <circle
              key={d.id}
              cx={cx + r * Math.cos(a)}
              cy={cy + r * Math.sin(a)}
              r={dotR}
              fill={d.color}
            />
          );
        })}
      </g>

      {/* H mark — static, always centred */}
      {showH && (
        <g fill={hFill}>
          <rect x={hx} y={hy} width={sw} height={hH} rx={sw * 0.3} />
          <rect x={hx + hW - sw} y={hy} width={sw} height={hH} rx={sw * 0.3} />
          <rect x={hx + sw} y={cy - cbH / 2} width={hW - sw * 2} height={cbH} rx={cbH * 0.3} />
        </g>
      )}
    </svg>
  );
}

// ─── Controls ──────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 0.1, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{label}</span>
        <span style={{ fontSize: 12, color: COLORS.stone, fontFamily: "monospace" }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: COLORS.ink }} />
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function SpinPlayground() {
  const [speed,     setSpeed]     = useState(6);
  const [direction, setDirection] = useState(1);
  const [dotScale,  setDotScale]  = useState(1);
  const [spread,    setSpread]    = useState(0.32);
  const [showH,     setShowH]     = useState(true);
  const [paused,    setPaused]    = useState(false);

  return (
    <div style={{ background: COLORS.cream, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid ${COLORS.sand}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: COLORS.ink, letterSpacing: "-0.02em" }}>
          Spin playground
        </div>
        <div style={{ fontSize: 12, color: COLORS.stone, marginTop: 3 }}>
          The four dots orbit the H — no colour is ever fixed at the top
        </div>
      </div>

      {/* Hero preview */}
      <div style={{ background: COLORS.ink, padding: "48px 24px", display: "flex", justifyContent: "center", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
        {/* Large centrepiece */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <SpinMark size={180} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={showH} paused={paused} variant="light" />
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: COLORS.cream, letterSpacing: "-0.02em" }}>Hue</div>
        </div>

        {/* Small sizes in context */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
          {/* App header style */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: COLORS.cream, borderRadius: 16, padding: "12px 16px" }}>
            <SpinMark size={40} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={showH} paused={paused} variant="light" />
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>Hue</span>
          </div>

          {/* Chat avatar style */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <SpinMark size={36} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={showH} paused={paused} variant="light" />
            <div style={{ background: COLORS.ink, borderRadius: "4px 18px 18px 18px", padding: "10px 14px", maxWidth: 180 }}>
              <span style={{ fontSize: 13, color: COLORS.cream, lineHeight: 1.5 }}>Hi, I'm Hue! Ready to find your colours?</span>
            </div>
          </div>

          {/* Tiny / favicon */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[20, 28, 36].map(s => (
              <SpinMark key={s} size={s} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={false} paused={paused} variant="light" />
            ))}
            <span style={{ fontSize: 11, color: COLORS.stone }}>favicon / micro</span>
          </div>
        </div>
      </div>

      {/* Variant row */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.sand}` }}>
        {/* On cream */}
        <div style={{ flex: 1, padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, borderRight: `1px solid ${COLORS.sand}` }}>
          <SpinMark size={80} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={showH} paused={paused} variant="light" />
          <span style={{ fontSize: 10, color: COLORS.stone, textTransform: "uppercase", letterSpacing: "0.1em" }}>On cream</span>
        </div>
        {/* On dark */}
        <div style={{ flex: 1, padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: COLORS.ink, borderRight: `1px solid ${COLORS.stone}33` }}>
          <SpinMark size={80} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={showH} paused={paused} variant="light" />
          <span style={{ fontSize: 10, color: COLORS.stone, textTransform: "uppercase", letterSpacing: "0.1em" }}>On ink</span>
        </div>
        {/* Floating — no bg, just dots + H on colour */}
        <div style={{ flex: 1, padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: `linear-gradient(135deg, ${COLORS.spark}33, ${COLORS.flow}33)` }}>
          <SpinMark size={80} speed={speed} direction={direction} dotScale={dotScale} spread={spread} showH={showH} paused={paused} variant="float" />
          <span style={{ fontSize: 10, color: COLORS.stone, textTransform: "uppercase", letterSpacing: "0.1em" }}>Floating</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: "24px 24px 60px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.stone, marginBottom: 20 }}>
          Controls
        </div>

        <Slider label="Speed (seconds per revolution)" value={speed} min={1} max={20} step={0.5} onChange={setSpeed} />
        <Slider label="Dot size" value={dotScale} min={0.6} max={1.4} step={0.05} onChange={setDotScale} />
        <Slider label="Orbit radius" value={spread} min={0.18} max={0.42} step={0.01} onChange={setSpread} />

        {/* Toggle row */}
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          {[
            { label: paused ? "▶ Play" : "⏸ Pause", action: () => setPaused(p => !p), active: paused },
            { label: direction === 1 ? "↻ Clockwise" : "↺ Counter", action: () => setDirection(d => d * -1), active: false },
            { label: showH ? "Hide H" : "Show H", action: () => setShowH(h => !h), active: !showH },
          ].map(({ label, action, active }) => (
            <button key={label} onClick={action} style={{
              padding: "10px 18px", borderRadius: 99, border: `1.5px solid ${COLORS.sand}`,
              background: active ? COLORS.ink : "#fff",
              color: active ? COLORS.cream : COLORS.ink,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {/* Sweet spot presets */}
        <div style={{ marginTop: 28, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.stone, marginBottom: 12 }}>
            Presets
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Breathing — almost imperceptible",  speed: 18, scale: 1,    spread: 0.32 },
              { label: "Ambient — you notice it eventually", speed: 10, scale: 1,    spread: 0.32 },
              { label: "Alive — clearly in motion",         speed: 6,  scale: 1,    spread: 0.32 },
              { label: "Energised — Duolingo-like",         speed: 3,  scale: 0.95, spread: 0.30 },
              { label: "Tight orbit — compact feel",        speed: 6,  scale: 1.1,  spread: 0.24 },
              { label: "Wide orbit — open, airy",           speed: 8,  scale: 0.9,  spread: 0.40 },
            ].map(p => (
              <button key={p.label} onClick={() => { setSpeed(p.speed); setDotScale(p.scale); setSpread(p.spread); setPaused(false); }}
                style={{
                  padding: "12px 16px", borderRadius: 12, border: `1px solid ${COLORS.sand}`,
                  background: "#fff", textAlign: "left", cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: COLORS.ink,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                <span>{p.label}</span>
                <span style={{ fontSize: 11, color: COLORS.stone }}>{p.speed}s</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 18px", background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.sand}`, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>The idea</div>
          <div style={{ fontSize: 13, color: COLORS.stone, lineHeight: 1.6 }}>
            The dots orbit the H continuously — no colour ever sits permanently at the top. It's the visual expression of the core philosophy: energies are tendencies, not fixed traits. The H stays still. The colours move around it.
          </div>
        </div>
      </div>
    </div>
  );
}
