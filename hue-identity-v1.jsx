import { useState, useEffect, useRef } from "react";

// ─── Tokens ────────────────────────────────────────────────────────────────────
const colors = {
  cream: "#FDFAF4",
  ink:   "#1A1410",
  sand:  "#E8DFC8",
  stone: "#9B8E7E",
  spark:      "#D92010",
  sparkLight: "#FFF0ED",
  sparkMid:   "#F06040",
  glow:       "#F5D000",
  glowLight:  "#FEFCE8",
  glowMid:    "#F9E566",
  root:       "#1A8C4E",
  rootLight:  "#E8F7EF",
  rootMid:    "#32B06A",
  flow:       "#1755B8",
  flowLight:  "#E8F0FC",
  flowMid:    "#3D78D8",
};

// Canonical quadrant order — clockwise from TL:
// Spark (red) TL → Glow (yellow) TR → Root (green) BR → Flow (blue) BL
const energies = [
  { id: "spark", name: "Spark", color: colors.spark, light: colors.sparkLight, mid: colors.sparkMid, symbol: "◆", description: "Drive · Action · Ignition",     quad: "TL" },
  { id: "glow",  name: "Glow",  color: colors.glow,  light: colors.glowLight,  mid: colors.glowMid,  symbol: "●", description: "Warmth · Optimism · Connection", quad: "TR" },
  { id: "root",  name: "Root",  color: colors.root,  light: colors.rootLight,  mid: colors.rootMid,  symbol: "▲", description: "Steadiness · Care · Depth",      quad: "BR" },
  { id: "flow",  name: "Flow",  color: colors.flow,  light: colors.flowLight,  mid: colors.flowMid,  symbol: "◉", description: "Clarity · Systems · Vision",     quad: "BL" },
];

// Grid display order: Spark TL, Glow TR, Flow BL, Root BR
// Bottom row swaps so Flow is left and Root is right — mirrors mark anatomy
const gridOrder = [energies[0], energies[1], energies[3], energies[2]];

// ─── Logo Mark ────────────────────────────────────────────────────────────────
// The four dots orbit the H continuously — no colour ever fixed at the top.
// This is the philosophy made visual: energies are tendencies, not fixed traits.
//
// variant: "light" → white circle bg, H in ink   (default — use on any surface)
//          "dark"  → ink circle bg, H in cream    (special use)
//          "icon"  → rounded-square bg, H in ink  (app icon / home screen)
//          "float" → no background                (splash, loading overlays)
//
// speed: seconds per full revolution (default 8 — ambient, noticeable but calm)
// paused: freeze the dots (e.g. when assessment is complete / result shown)
function HueLogo({ size = 48, variant = "light", speed = 8, paused = false }) {
  const cx      = size / 2;
  const cy      = size / 2;
  const orbitR  = size * 0.30;   // orbit radius from centre
  const dotR    = size * 0.158;  // dot radius
  const angleRef = useRef(45);   // start at 45° so dots open in quadrant positions
  const rafRef   = useRef(null);
  const lastRef  = useRef(null);
  const gRef     = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = ts - lastRef.current;
      lastRef.current = ts;
      if (!paused) angleRef.current += (dt / 1000) * (360 / speed);
      if (gRef.current) {
        gRef.current.setAttribute("transform", `rotate(${angleRef.current} ${cx} ${cy})`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, paused, cx, cy]);

  // Dot start angles — clockwise: Spark 315°(TL), Glow 45°(TR), Root 135°(BR), Flow 225°(BL)
  const dotAngles = [315, 45, 135, 225];

  const bgFill = variant === "dark" ? colors.ink : "#FFFFFF";
  const hFill  = variant === "dark" ? colors.cream : colors.ink;

  // H geometry — three rects, fully controlled stroke weight
  const hW  = size * 0.30;
  const hH  = size * 0.28;
  const sw  = size * 0.055;
  const cbH = size * 0.055;
  const hx  = cx - hW / 2;
  const hy  = cy - hH / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block", flexShrink: 0 }}>

      {/* Background container */}
      {variant === "icon"
        ? <rect x={0} y={0} width={size} height={size} rx={size * 0.24} fill={bgFill} />
        : variant !== "float"
          ? <circle cx={cx} cy={cy} r={size * 0.48} fill={bgFill} />
          : null
      }

      {/* Orbiting dots — rotate as a group around centre */}
      <g ref={gRef}>
        {energies.map((e, i) => {
          const a = (dotAngles[i] * Math.PI) / 180;
          return (
            <circle
              key={e.id}
              cx={cx + orbitR * Math.cos(a)}
              cy={cy + orbitR * Math.sin(a)}
              r={dotR}
              fill={e.color}
            />
          );
        })}
      </g>

      {/* H mark — always static at the centre, dots move around it */}
      <g fill={hFill}>
        <rect x={hx} y={hy} width={sw} height={hH} rx={sw * 0.3} />
        <rect x={hx + hW - sw} y={hy} width={sw} height={hH} rx={sw * 0.3} />
        <rect x={hx + sw} y={cy - cbH / 2} width={hW - sw * 2} height={cbH} rx={cbH * 0.3} />
      </g>
    </svg>
  );
}

// ─── Energy Card ─────────────────────────────────────────────────────────────
function EnergyCard({ energy, percent = 0, rank = 1, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const [barW, setBarW]       = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setBarW(percent), delay + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay, percent]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
      background: energy.light,
      borderRadius: 20,
      padding: "18px 22px",
      border: `1.5px solid ${energy.color}28`,
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 14, right: 14,
        width: 26, height: 26, borderRadius: "50%",
        background: rank === 1 ? energy.color : "transparent",
        border: `2px solid ${rank === 1 ? energy.color : colors.stone + "44"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: rank === 1 ? "#fff" : colors.stone,
      }}>{rank}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
        <span style={{ fontSize: 20, color: energy.color, lineHeight: 1 }}>{energy.symbol}</span>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 700, color: colors.ink }}>{energy.name}</span>
      </div>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: colors.stone, margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {energy.description}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 5, background: energy.color + "22", borderRadius: 99 }}>
          <div style={{ width: `${barW}%`, height: "100%", background: energy.color, borderRadius: 99, transition: "width 0.9s cubic-bezier(0.23, 1, 0.32, 1)" }} />
        </div>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: energy.color, minWidth: 40, textAlign: "right" }}>{percent}%</span>
      </div>
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ from = "hue", text, delay = 0, energy }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isHue = from === "hue";
  return (
    <div style={{
      display: "flex", flexDirection: isHue ? "row" : "row-reverse",
      gap: 10, alignItems: "flex-end",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.45s cubic-bezier(0.23, 1, 0.32, 1)",
      marginBottom: 12,
    }}>
      {isHue && <HueLogo size={32} variant="light" speed={10} />}
      <div style={{
        maxWidth: "72%",
        background: isHue ? colors.ink : (energy ? energy.light : colors.sand),
        color: isHue ? colors.cream : colors.ink,
        borderRadius: isHue ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
        padding: "12px 16px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 14, lineHeight: 1.55,
        border: !isHue && energy ? `1.5px solid ${energy.color}33` : "none",
      }}>{text}</div>
    </div>
  );
}

// ─── Swatch Row ──────────────────────────────────────────────────────────────
function SwatchRow({ label, hex, note }) {
  const [copied, setCopied] = useState(false);
  return (
    <div onClick={() => { navigator.clipboard?.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: `1px solid ${colors.sand}`, cursor: "pointer" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: hex, border: `1px solid ${colors.ink}11`, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: colors.ink }}>{label}</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: colors.stone }}>{note}</div>
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: copied ? colors.root : colors.stone, fontWeight: 600, letterSpacing: "0.04em" }}>
        {copied ? "Copied!" : hex}
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: colors.stone, marginBottom: 16 }}>
      {children}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function HueIdentity() {
  const [activeSection, setActiveSection] = useState("logo");
  const sections = ["logo", "colours", "type", "components", "screens"];

  const sampleResult = [
    { energy: energies[3], percent: 38, rank: 1 },
    { energy: energies[0], percent: 28, rank: 2 },
    { energy: energies[2], percent: 22, rank: 3 },
    { energy: energies[1], percent: 12, rank: 4 },
  ];

  return (
    <div style={{ background: colors.cream, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${colors.sand}; border-radius: 99px; }
        @keyframes dot-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes pulse-ring { 0%{opacity:0.4;transform:scale(0.8)} 100%{opacity:0;transform:scale(2.2)} }
      `}</style>

      {/* ── App header ── */}
      <div style={{ padding: "28px 24px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: `1px solid ${colors.sand}` }}>
        <div style={{}}>
          <HueLogo size={44} variant="light" speed={10} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: colors.ink, letterSpacing: "-0.02em" }}>Hue AI</div>
          <div style={{ fontSize: 11, color: colors.stone, letterSpacing: "0.05em", textTransform: "uppercase" }}>Visual Identity System</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ display: "flex", gap: 4, padding: "14px 24px", overflowX: "auto", borderBottom: `1px solid ${colors.sand}` }}>
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            padding: "8px 16px", borderRadius: 99, border: "none", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600,
            background: activeSection === s ? colors.ink : "transparent",
            color: activeSection === s ? colors.cream : colors.stone,
            transition: "all 0.2s", textTransform: "capitalize", whiteSpace: "nowrap",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ padding: "24px 24px 80px" }}>

        {/* ══ LOGO ══════════════════════════════════════════════════════════════ */}
        {activeSection === "logo" && (
          <div>
            <SectionLabel>Logomark System</SectionLabel>

            {/* Hero on cream */}
            <div style={{ background: colors.cream, border: `1.5px solid ${colors.sand}`, borderRadius: 24, padding: "44px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginBottom: 14 }}>
              <div style={{}}>
                <HueLogo size={108} variant="light" speed={10} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 700, color: colors.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>Hue</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: colors.stone, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 7 }}>
                  Colour Energy Assessment
                </div>
              </div>
            </div>

            {/* Dark variant — logo always on its own white circle, never naked on ink */}
            <div style={{ background: colors.ink, borderRadius: 24, padding: "28px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: colors.cream }}>Dark variant</div>
                <div style={{ fontSize: 11, color: colors.stone, marginTop: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dots always on white — crisp on any bg</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <HueLogo size={48} variant="light" />
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: colors.cream, letterSpacing: "-0.02em" }}>Hue</span>
              </div>
            </div>

            {/* App icon variant */}
            <div style={{ background: colors.sand + "66", borderRadius: 24, padding: "28px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: colors.ink }}>App icon</div>
                <div style={{ fontSize: 11, color: colors.stone, marginTop: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rounded-square — iOS / Android</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                {[72, 52, 36].map(s => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <HueLogo size={s} variant="icon" />
                    <span style={{ fontSize: 9, color: colors.stone, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mark anatomy — hero treatment */}
            <div style={{ background: "#fff", border: `1.5px solid ${colors.sand}`, borderRadius: 24, padding: "32px 28px", marginBottom: 14 }}>
              <SectionLabel>Mark anatomy</SectionLabel>
              {/* Large mark — given real space to breathe */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
                <HueLogo size={180} variant="light" speed={12} />
              </div>
              {/* 2×2 label grid — Spark TL, Glow TR, Flow BL, Root BR */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 28px" }}>
                {gridOrder.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: e.color, flexShrink: 0,
                      boxShadow: `0 0 0 4px ${e.color}22`,
                    }} />
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: colors.ink, lineHeight: 1.1 }}>{e.name}</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: colors.stone, marginTop: 2 }}>
                        {e.description.split("·")[0].trim()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Size scale */}
            <div style={{ background: colors.sand + "44", borderRadius: 20, padding: "20px 24px", marginBottom: 14 }}>
              <SectionLabel>Size scale</SectionLabel>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
                {[20, 32, 48, 72].map(s => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <HueLogo size={s} variant="light" />
                    <span style={{ fontSize: 9, color: colors.stone, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear space */}
            <div style={{ padding: "16px 20px", background: colors.flowLight, borderRadius: 16, borderLeft: `3px solid ${colors.flow}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.flow, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Clear space rule</div>
              <div style={{ fontSize: 13, color: colors.ink, lineHeight: 1.55, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Maintain clear space of <strong>½ the mark height</strong> on all sides. Never place dots directly on a coloured or photographic background — always use the white container.
              </div>
            </div>
          </div>
        )}

        {/* ══ COLOURS ═══════════════════════════════════════════════════════════ */}
        {activeSection === "colours" && (
          <div>
            <SectionLabel>Colour System</SectionLabel>

            {/* 2×2 energy grid: Spark TL, Glow TR, Flow BL, Root BR */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {gridOrder.map(e => (
                <div key={e.id} style={{ borderRadius: 20, overflow: "hidden", boxShadow: `0 2px 16px ${e.color}20` }}>
                  {/* Tall colour block — name bottom-left, symbol top-right */}
                  <div style={{ background: e.color, height: 130, position: "relative", display: "flex", alignItems: "flex-end", padding: "0 16px 16px" }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1 }}>{e.name}</span>
                    <span style={{ position: "absolute", top: 14, right: 16, fontSize: 20, color: "#fff", opacity: 0.9 }}>{e.symbol}</span>
                  </div>
                  {/* Description */}
                  <div style={{ background: e.light, padding: "13px 16px" }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: colors.stone, lineHeight: 1.55 }}>{e.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <SectionLabel>Foundation palette — tap to copy</SectionLabel>
            <div style={{ background: "#fff", borderRadius: 20, padding: "4px 16px", marginBottom: 20, border: `1px solid ${colors.sand}` }}>
              <SwatchRow label="Cream" hex={colors.cream} note="Primary background · Warm, inviting" />
              <SwatchRow label="Ink"   hex={colors.ink}   note="Primary text · Deep warm black" />
              <SwatchRow label="Sand"  hex={colors.sand}  note="Dividers · Subtle containers" />
              <SwatchRow label="Stone" hex={colors.stone} note="Secondary text · Captions" />
            </div>

            <SectionLabel>Energy colours — tap to copy</SectionLabel>
            <div style={{ background: "#fff", borderRadius: 20, padding: "4px 16px", marginBottom: 20, border: `1px solid ${colors.sand}` }}>
              <SwatchRow label="Spark" hex={colors.spark} note="Drive · Action · Red energy" />
              <SwatchRow label="Glow"  hex={colors.glow}  note="Warmth · Optimism · Yellow energy" />
              <SwatchRow label="Root"  hex={colors.root}  note="Steadiness · Care · Green energy" />
              <SwatchRow label="Flow"  hex={colors.flow}  note="Clarity · Systems · Blue energy" />
            </div>

            <SectionLabel>Tint system</SectionLabel>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {energies.map(e => (
                <div key={e.id} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ height: 36, borderRadius: "8px 8px 0 0", background: e.color }} />
                  <div style={{ height: 22, background: e.mid }} />
                  <div style={{ height: 22, background: e.light, borderRadius: "0 0 8px 8px", border: `1px solid ${e.color}22` }} />
                  <div style={{ fontSize: 9, color: colors.stone, textAlign: "center", paddingTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{e.name}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 20px", background: colors.glowLight, borderRadius: 16, borderLeft: `3px solid ${colors.glow}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Colour philosophy</div>
              <div style={{ fontSize: 13, color: colors.ink, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                No energy is "better" than another. All four appear in every result — rankings reflect <em>tendency</em>, not identity. Colours are always shown together, never in isolation.
              </div>
            </div>
          </div>
        )}

        {/* ══ TYPE ══════════════════════════════════════════════════════════════ */}
        {activeSection === "type" && (
          <div>
            <SectionLabel>Typography System</SectionLabel>

            <div style={{ background: colors.ink, borderRadius: 24, padding: 28, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: colors.stone, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Display · Fraunces</div>
              <div style={{ fontFamily: "'Fraunces', serif", color: colors.cream, lineHeight: 1.05 }}>
                <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.03em" }}>Hue</div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", opacity: 0.85 }}>Colour Energy</div>
                <div style={{ fontSize: 22, fontWeight: 300, fontStyle: "italic", opacity: 0.5, marginTop: 6 }}>tends toward clarity</div>
              </div>
            </div>

            <div style={{ background: colors.sand + "55", borderRadius: 24, padding: 28, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: colors.stone, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Body · Plus Jakarta Sans</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: colors.ink }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Your energy profile is ready</div>
                <div style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.65, color: colors.stone }}>
                  Based on our conversation, here's how your colour energies naturally show up. These aren't limits — they're the patterns you tend to reach for first.
                </div>
              </div>
            </div>

            <SectionLabel>Type scale</SectionLabel>
            {[
              { size: 36, weight: 700, family: "Fraunces",          use: "Hero / Name",   text: "Your Profile" },
              { size: 24, weight: 700, family: "Fraunces",          use: "Section title", text: "Colour Energies" },
              { size: 18, weight: 600, family: "Plus Jakarta Sans",  use: "Card title",    text: "Flow Energy" },
              { size: 15, weight: 400, family: "Plus Jakarta Sans",  use: "Body",          text: "Tends toward structured thinking and long-range clarity" },
              { size: 12, weight: 500, family: "Plus Jakarta Sans",  use: "Caption",       text: "CLARITY · SYSTEMS · VISION" },
              { size: 11, weight: 700, family: "Plus Jakarta Sans",  use: "Tag / Badge",   text: "38%" },
            ].map((t, i) => (
              <div key={i} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${colors.sand}` }}>
                <div style={{ fontSize: 10, color: colors.stone, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {t.use} · {t.family} {t.size}/{t.weight}
                </div>
                <div style={{
                  fontFamily: `'${t.family}', ${t.family === "Fraunces" ? "serif" : "sans-serif"}`,
                  fontSize: t.size, fontWeight: t.weight, color: colors.ink,
                  letterSpacing: t.family === "Fraunces" ? "-0.02em" : t.size < 13 ? "0.07em" : "normal",
                }}>{t.text}</div>
              </div>
            ))}

            <div style={{ padding: "16px 20px", background: colors.sparkLight, borderRadius: 16, borderLeft: `3px solid ${colors.spark}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.spark, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Voice & tone</div>
              <div style={{ fontSize: 13, color: colors.ink, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Always <em>tends toward</em>, <em>naturally reaches for</em>, <em>often draws on</em> — never "is" or "leads with" exclusively. Playful warmth, not corporate assessment language.
              </div>
            </div>
          </div>
        )}

        {/* ══ COMPONENTS ════════════════════════════════════════════════════════ */}
        {activeSection === "components" && (
          <div>
            <SectionLabel>Component Library</SectionLabel>

            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Buttons</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button style={{ background: colors.ink, color: colors.cream, border: "none", borderRadius: 99, padding: "16px 28px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Begin my assessment ◆
                </button>
                <button style={{ background: "transparent", color: colors.ink, border: `2px solid ${colors.ink}`, borderRadius: 99, padding: "14px 28px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                  See my full profile
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  {energies.map(e => (
                    <button key={e.id} style={{ flex: 1, background: e.light, color: e.color, border: `1.5px solid ${e.color}55`, borderRadius: 99, padding: "10px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      {e.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Energy tags</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {energies.map(e => (
                  <span key={e.id} style={{ background: e.light, color: e.color, border: `1.5px solid ${e.color}44`, borderRadius: 99, padding: "7px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700 }}>
                    {e.symbol} {e.name}
                  </span>
                ))}
                <span style={{ background: colors.sand, color: colors.stone, borderRadius: 99, padding: "7px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
                  All energies
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Chat input</SectionLabel>
              <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#fff", borderRadius: 99, border: `1.5px solid ${colors.sand}`, padding: "8px 8px 8px 20px" }}>
                <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: colors.stone }}>Tell Hue about yourself…</span>
                <div style={{ background: colors.ink, borderRadius: 99, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <span style={{ color: colors.cream, fontSize: 18 }}>↑</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Hue avatar states</SectionLabel>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {[
                  { label: "Offline",   sublabel: "Not available",  dot: "#9B8E7E", pulse: false },
                  { label: "Thinking",  sublabel: "Processing…",    dot: "#F5A623", pulse: true  },
                  { label: "Active",    sublabel: "Ready to chat",  dot: "#22C55E", pulse: true  },
                ].map(({ label, sublabel, dot, pulse }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flex: 1 }}>
                    {/* Logo + traffic-light indicator — indicator sits BELOW the mark, not overlapping */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <HueLogo size={52} variant="light" />
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* Pulse ring — only on active states */}
                        {pulse && (
                          <div style={{
                            position: "absolute",
                            width: 20, height: 20, borderRadius: "50%",
                            background: dot, opacity: 0.3,
                            animation: "pulse-ring 1.8s ease-out infinite",
                          }} />
                        )}
                        <div style={{
                          width: 12, height: 12, borderRadius: "50%",
                          background: dot,
                          border: `2px solid ${colors.cream}`,
                          boxShadow: `0 0 0 1px ${dot}`,
                          position: "relative", zIndex: 1,
                        }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
                      <div style={{ fontSize: 10, color: colors.stone, fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 1 }}>{sublabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Progress indicator</SectionLabel>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= 3 ? colors.ink : colors.sand }} />
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: colors.stone, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>3 of 5 exchanges</div>
            </div>

            <SectionLabel>Elevation system</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Flat",     shadow: "none",                       bg: colors.cream, border: `1.5px solid ${colors.sand}` },
                { label: "Raised",   shadow: `0 2px 12px ${colors.ink}0A`, bg: "#fff",       border: `1px solid ${colors.sand}` },
                { label: "Floating", shadow: `0 8px 32px ${colors.ink}14`, bg: "#fff",       border: "none" },
              ].map((e, i) => (
                <div key={e.label} style={{ background: e.bg, border: e.border, borderRadius: 16, padding: "14px 18px", boxShadow: e.shadow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: colors.ink }}>{e.label}</span>
                  <span style={{ fontSize: 11, color: colors.stone, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Level {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SCREENS ═══════════════════════════════════════════════════════════ */}
        {activeSection === "screens" && (
          <div>
            <SectionLabel>Screen Designs</SectionLabel>

            {/* 01 Welcome */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: colors.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>01 · Welcome</div>
              <div style={{ background: colors.ink, borderRadius: 28, padding: "40px 28px", position: "relative", overflow: "hidden" }}>
                {/* Atmospheric corner orbs — fixed to canonical quadrant positions */}
                {[
                  { e: energies[0], style: { top: -30,    left: -30   } }, // Spark TL
                  { e: energies[1], style: { top: -30,    right: -30  } }, // Glow  TR
                  { e: energies[2], style: { bottom: -30, right: -30  } }, // Root  BR
                  { e: energies[3], style: { bottom: -30, left: -30   } }, // Flow  BL
                ].map(({ e, style }) => (
                  <div key={e.id} style={{
                    position: "absolute", width: 110, height: 110, borderRadius: "50%",
                    background: e.color, opacity: 0.2, filter: "blur(30px)", ...style,
                  }} />
                ))}

                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ marginBottom: 26, animation: "float 3.5s ease-in-out infinite" }}>
                    <HueLogo size={84} variant="light" speed={8} />
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 700, color: colors.cream, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 12 }}>
                    Meet your colours
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: colors.stone, lineHeight: 1.65, marginBottom: 32, maxWidth: 280 }}>
                    A short conversation with Hue reveals how your four colour energies show up — and in what order.
                  </div>
                  <button style={{ width: "100%", background: colors.cream, color: colors.ink, border: "none", borderRadius: 99, padding: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 20 }}>
                    Begin the conversation
                  </button>
                  {/* Energy pills — white text always on dark welcome screen for legibility */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    {energies.map(e => (
                      <span key={e.id} style={{
                        background: `${e.color}45`,
                        color: "#FFFFFF",
                        border: `1.5px solid ${e.color}`,
                        borderRadius: 99,
                        padding: "6px 14px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {e.symbol} {e.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 02 Assessment conversation */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: colors.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>02 · Assessment conversation</div>
              <div style={{ background: colors.cream, border: `1.5px solid ${colors.sand}`, borderRadius: 28, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${colors.sand}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <HueLogo size={36} variant="light" speed={10} />
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: colors.ink }}>Hue</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 0 2px #22C55E33" }} />
                      <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Active</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ width: 18, height: 3, borderRadius: 99, background: i <= 2 ? colors.ink : colors.sand }} />
                    ))}
                  </div>
                </div>
                <div style={{ padding: "20px 16px" }}>
                  <ChatBubble from="hue"  text="Hi, I'm Hue! I'm going to ask you a few questions — there are no right answers, just honest ones. Ready?" delay={100} />
                  <ChatBubble from="user" text="Ready!" delay={400} energy={energies[3]} />
                  <ChatBubble from="hue"  text="Love it. Let's start simple: when you join a new project, what's the first thing you find yourself doing?" delay={700} />
                  {/* Typing indicator */}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 4 }}>
                    <HueLogo size={32} variant="light" speed={10} />
                    <div style={{ background: colors.sand, borderRadius: "4px 14px 14px 14px", padding: "12px 16px", display: "flex", gap: 5 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: "50%", background: colors.stone,
                          animation: "dot-bounce 1.2s ease-in-out infinite",
                          animationDelay: `${i * 0.2}s`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${colors.sand}` }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#fff", borderRadius: 99, border: `1.5px solid ${colors.sand}`, padding: "8px 8px 8px 18px" }}>
                    <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: colors.stone }}>Your answer…</span>
                    <div style={{ background: colors.ink, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <span style={{ color: colors.cream, fontSize: 17 }}>↑</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 03 Results */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: colors.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>03 · Results</div>
              <div style={{ background: colors.cream, border: `1.5px solid ${colors.sand}`, borderRadius: 28, padding: 24 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: colors.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Your colour energy profile</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: colors.ink, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                    You tend toward<br /><em style={{ color: colors.flow }}>Flow</em> first
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sampleResult.map(({ energy, percent, rank }, i) => (
                    <EnergyCard key={energy.id} energy={energy} percent={percent} rank={rank} delay={i * 120} />
                  ))}
                </div>
                <div style={{ marginTop: 20, padding: "16px 18px", background: colors.flowLight, borderRadius: 16, borderLeft: `3px solid ${colors.flow}` }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>Flow energy naturally:</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: colors.stone, lineHeight: 1.6 }}>
                    Reaches for structure before action · Tends to think in systems and long arcs · Often asks "what's the bigger picture?" before diving in.
                  </div>
                </div>
                <button style={{ width: "100%", marginTop: 20, background: colors.ink, color: colors.cream, border: "none", borderRadius: 99, padding: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Continue to Hue assistant →
                </button>
              </div>
            </div>

            {/* Motion principles */}
            <div style={{ padding: "16px 20px", background: colors.rootLight, borderRadius: 16, borderLeft: `3px solid ${colors.root}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.root, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Motion principles</div>
              <div style={{ fontSize: 13, color: colors.ink, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                All transitions use <strong>cubic-bezier(0.23, 1, 0.32, 1)</strong> — springy but not bouncy. Results cards stagger at 120ms. Chat bubbles slide up from 12px. Logo floats at 3.5s. Nothing spins.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
