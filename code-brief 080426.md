# Hue — Three UI Updates

Please implement all three of the following changes. SVG paths are provided exactly as they should appear in the app — use them verbatim.

---

## 1. Energy Icons

Replace all existing energy indicators throughout the app with these four new SVG line icons. All icons use `fill: none`, `stroke-linecap: round`, `stroke-linejoin: round`. Stroke weight scales with size as shown.

### Spark (red — #E03120)
```svg
<path d="M13 2L5 13h7l-1 9 9-12h-7z"/>
```

### Glow (amber — #D4940A)
```svg
<circle cx="12" cy="12" r="9"/>
<circle cx="12" cy="12" r="4"/>
```

### Tend (green — #3A7D44)
```svg
<path d="M19 3 C18 6 11 5 8 9 C5 13 4 18 5 21 C6 18 13 19 16 15 C19 11 20 6 19 3 Z"/>
<path d="M19 3 C15 8 10 14 5 21"/>
<line x1="5" y1="21" x2="3" y2="24"/>
```
*(Elongated pointed leaf at 45°, midrib running tip to tip, stem trailing below. Gap between outer edges matches the gap between Glow's two circles.)*

### Flow (blue — #1A5EA8)
```svg
<path d="M3 9 C6 6 9 6 12 9 C15 12 18 12 21 9"/>
<path d="M3 15 C6 12 9 12 12 15 C15 18 18 18 21 15"/>
```

### Stroke weights by size
| Size | stroke-width |
|------|-------------|
| 64px | 1.8 |
| 40px | 2.0 |
| 28px | 2.2 |
| 20px | 2.4 |

### Icon container
Each icon sits in a rounded square container (border-radius: 28% of size). Background uses the energy's light tint token on cream, energy colour stroke on dark backgrounds.

---

## 2. App-Wide Navigation Icons

Replace any existing text-based navigation with three icon-only buttons wherever the nav bar appears across the app — results screen, welcome screen, companion chat, profile, team dashboard, everywhere. This is a global change to the nav component, not just the results screen.

Each button: 36×36px, border-radius 10px, background `rgba(0,0,0,0.05)`, stroke `#1A1410`, stroke-width 1.8, fill none, stroke-linecap round, stroke-linejoin round.

**Home**
```svg
<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
<path d="M9 21V12h6v9"/>
```

**Share**
```svg
<circle cx="18" cy="5" r="3"/>
<circle cx="6" cy="12" r="3"/>
<circle cx="18" cy="19" r="3"/>
<path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/>
```

**Save**
```svg
<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
<path d="M17 21v-8H7v8M7 3v5h8"/>
```

Show only the icons that are contextually relevant per screen — e.g. Share and Save make sense on the results screen, Home makes sense everywhere except the home screen itself.

---

## 3. Results Screen — Layout Redesign

Restructure the results screen so all four energy cards are visible on first load without scrolling. Order cards by score descending.

### Structure (top to bottom)
1. **Bespoke observation** — dark card at top ("only you" moment)
2. **Four energy cards** — all collapsed by default, chevron to expand each. Each card shows: energy icon (28px) + energy name + position label (Instinctive / Fluent / Intentional / Developing) + score bar + percentage + chevron
3. **"Talk about your results"** — full-width pill button, ink background, chat icon left, below the four cards
4. **"Learn more"** — centred below the Talk button. Small copy: *"There's more to explore — misreads, how you are under pressure, your flex crossings."* Ghost button: "Learn more ↓"

### Card colours
Each card uses the energy's existing light tint background and mid tint border:
- Spark: `sparkLight` bg, `sparkMid` border, spark-coloured text/icon/bar
- Glow: `glowLight` bg, `glowMid` border
- Tend: `tendLight` bg, `tendMid` border  
- Flow: `flowLight` bg, `flowMid` border



---

## 3. Animated Hue Logo — Chat Thinking State

In the companion chat, show the animated Hue orbiting-dots logo while Hue is generating a response.

**Trigger:** API call starts (user sends message)  
**Dismiss:** First token of the response arrives and the chat bubble begins rendering — not when the full response is complete  
**Preset:** Use the existing "Alive" animation preset from `spin-playground.jsx` (6s speed)  
**Placement:** Centred in the chat area where the response bubble will appear — replaces any existing typing indicator  

Do not show the animation at any other time — not while the user is typing, not while they are reading. Only during the generation gap between send and first token.

---

*All colours reference existing tokens in the codebase. No new tokens needed.*
