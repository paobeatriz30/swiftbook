import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── STRIPE PAYMENT LINKS ─────────────────────────────────────────────────────
const STRIPE_LINKS = {
  starter:  "https://buy.stripe.com/14A28sgf19gW3g68qU2sM00",
  pro:      "https://buy.stripe.com/3cI00kfaX0Kg4kabD62sM01",
  business: "https://buy.stripe.com/dRm3cw7Iv78Oaly8qU2sM02",
};

// ─── STORAGE LAYER (Firebase-ready — swap for Firestore in Lovable) ────────────
const DB = {
  async get(key) {
    try {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async set(key, value) {
    try {
      await window.storage.set(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  async list(prefix) {
    try {
      const r = await window.storage.list(prefix);
      return r ? r.keys : [];
    } catch { return []; }
  },
  async delete(key) {
    try {
      await window.storage.delete(key);
      return true;
    } catch { return false; }
  },
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  black:     "#0D0D0D",
  surface:   "#1A1A1A",
  card:      "#1C1C2E",
  cardBorder:"#2A2A3E",
  border:    "#222222",
  gold:      "#C9A84C",
  goldLt:    "#E8C97E",
  emerald:   "#10B981",
  emeraldDk: "#0A2A0A",
  emeraldBd: "#1A4A1A",
  white:     "#FFFFFF",
  muted:     "#555555",
  dim:       "#333333",
  danger:    "#EF4444",
  ink:       "#0D0D0D",
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY    = "'Inter', system-ui, sans-serif";

// ─── INDUSTRIES ───────────────────────────────────────────────────────────────
const INDUSTRIES = {
  "🌿 Landscaping": [
    { name: "Lawn Mowing",               unit: "sq ft",      price: 0.05  },
    { name: "Artificial Turf Install",   unit: "sq ft",      price: 12    },
    { name: "Sod Installation",          unit: "sq ft",      price: 1.5   },
    { name: "Mulch Application",         unit: "cubic yard", price: 85    },
    { name: "Plant Installation",        unit: "plant",      price: 45    },
    { name: "Black Stone Border",        unit: "linear ft",  price: 8     },
    { name: "Irrigation System",         unit: "zone",       price: 350   },
    { name: "Fertilization",             unit: "sq ft",      price: 0.08  },
    { name: "Leaf Cleanup",              unit: "hour",       price: 55    },
    { name: "Tree Trimming",             unit: "tree",       price: 120   },
    { name: "Tree Removal",              unit: "tree",       price: 450   },
    { name: "Stump Grinding",            unit: "stump",      price: 175   },
    { name: "AC Unit Cover",             unit: "unit",       price: 280   },
    { name: "Concrete Patio",            unit: "sq ft",      price: 9     },
    { name: "Grill Area Setup",          unit: "project",    price: 450   },
    { name: "PM Fee – Landscaping",      unit: "hour",       price: 95    },
  ],
  "🏗️ Remodeling": [
    { name: "Drywall / Sheetrock",       unit: "sq ft",      price: 3.5   },
    { name: "Finish Carpentry / Trim",   unit: "linear ft",  price: 6     },
    { name: "Flooring Installation",     unit: "sq ft",      price: 6     },
    { name: "Hardwood Flooring",         unit: "sq ft",      price: 9     },
    { name: "Tile Work",                 unit: "sq ft",      price: 9     },
    { name: "Roofing – Shingles",        unit: "sq ft",      price: 4.5   },
    { name: "Roofing – Flat",            unit: "sq ft",      price: 6     },
    { name: "Window Installation",       unit: "window",     price: 350   },
    { name: "Door Installation",         unit: "door",       price: 280   },
    { name: "Kitchen Remodel",           unit: "project",    price: 8500  },
    { name: "Bathroom Remodel",          unit: "project",    price: 5500  },
    { name: "Interior Painting",         unit: "sq ft",      price: 2.5   },
    { name: "Demo / Teardown",           unit: "hour",       price: 65    },
    { name: "General Carpentry",         unit: "hour",       price: 75    },
    { name: "PM Fee – Remodeling",       unit: "hour",       price: 110   },
  ],
  "🔧 Plumbing": [
    { name: "Pipe Repair",               unit: "hour",       price: 95    },
    { name: "Water Heater Install",      unit: "unit",       price: 850   },
    { name: "Drain Cleaning",            unit: "drain",      price: 175   },
    { name: "Toilet Installation",       unit: "unit",       price: 250   },
    { name: "Faucet Replacement",        unit: "unit",       price: 185   },
    { name: "Water Line Install",        unit: "linear ft",  price: 12    },
    { name: "PM Fee – Plumbing",         unit: "hour",       price: 95    },
  ],
  "🎨 Painting": [
    { name: "Interior Painting",         unit: "sq ft",      price: 2.5   },
    { name: "Exterior Painting",         unit: "sq ft",      price: 3.2   },
    { name: "Cabinet Painting",          unit: "cabinet",    price: 85    },
    { name: "Trim & Baseboards",         unit: "linear ft",  price: 3     },
    { name: "Deck Staining",             unit: "sq ft",      price: 2.8   },
    { name: "Epoxy Floor Coating",       unit: "sq ft",      price: 4     },
    { name: "PM Fee – Painting",         unit: "hour",       price: 85    },
  ],
  "⚡ Electrical": [
    { name: "Outlet Installation",       unit: "outlet",     price: 150   },
    { name: "Panel Upgrade",             unit: "project",    price: 2200  },
    { name: "Light Fixture Install",     unit: "fixture",    price: 120   },
    { name: "Ceiling Fan Install",       unit: "fan",        price: 175   },
    { name: "EV Charger Install",        unit: "unit",       price: 950   },
    { name: "Wiring – New Circuit",      unit: "circuit",    price: 350   },
    { name: "PM Fee – Electrical",       unit: "hour",       price: 100   },
  ],
  "🧱 Hardscape & Concrete": [
    { name: "Concrete Patio",            unit: "sq ft",      price: 9     },
    { name: "Stamped Concrete",          unit: "sq ft",      price: 14    },
    { name: "Pool Deck",                 unit: "sq ft",      price: 12    },
    { name: "Retaining Wall",            unit: "linear ft",  price: 45    },
    { name: "Pavers & Walkways",         unit: "sq ft",      price: 16    },
    { name: "Driveway",                  unit: "sq ft",      price: 8     },
    { name: "Block & Brick Work",        unit: "sq ft",      price: 18    },
    { name: "Fence Installation",        unit: "linear ft",  price: 28    },
    { name: "Fence Repair",              unit: "linear ft",  price: 15    },
    { name: "Deck Construction",         unit: "sq ft",      price: 35    },
    { name: "Deck Repair",               unit: "sq ft",      price: 18    },
    { name: "PM Fee – Hardscape",        unit: "hour",       price: 100   },
  ],
  "🧹 Cleaning Services": [
    { name: "Residential Cleaning",      unit: "sq ft",      price: 0.12  },
    { name: "Deep Cleaning",             unit: "sq ft",      price: 0.22  },
    { name: "Move In/Out Cleaning",      unit: "sq ft",      price: 0.28  },
    { name: "Commercial Cleaning",       unit: "sq ft",      price: 0.15  },
    { name: "Post-Construction Cleanup", unit: "sq ft",      price: 0.35  },
    { name: "Window Cleaning",           unit: "window",     price: 12    },
    { name: "Carpet Cleaning",           unit: "sq ft",      price: 0.35  },
    { name: "PM Fee – Cleaning",         unit: "hour",       price: 65    },
  ],
  "❄️ HVAC": [
    { name: "AC Installation",           unit: "unit",       price: 3500  },
    { name: "AC Repair",                 unit: "hour",       price: 95    },
    { name: "AC Tune-Up",                unit: "unit",       price: 120   },
    { name: "Duct Cleaning",             unit: "vent",       price: 35    },
    { name: "Thermostat Install",        unit: "unit",       price: 180   },
    { name: "Heater Installation",       unit: "unit",       price: 2800  },
    { name: "PM Fee – HVAC",             unit: "hour",       price: 100   },
  ],
  "🚿 Pressure Washing": [
    { name: "Driveway Washing",          unit: "sq ft",      price: 0.35  },
    { name: "House Exterior Wash",       unit: "sq ft",      price: 0.30  },
    { name: "Deck / Patio Wash",         unit: "sq ft",      price: 0.40  },
    { name: "Roof Soft Wash",            unit: "sq ft",      price: 0.45  },
    { name: "Fence Washing",             unit: "linear ft",  price: 1.5   },
    { name: "Commercial Washing",        unit: "sq ft",      price: 0.50  },
    { name: "PM Fee – Pressure Wash",    unit: "hour",       price: 65    },
  ],
  "🛋️ Interior Design": [
    { name: "Design Consultation",       unit: "hour",       price: 150   },
    { name: "Full Room Design",          unit: "room",       price: 1200  },
    { name: "Furniture Selection",       unit: "hour",       price: 125   },
    { name: "Color Consultation",        unit: "project",    price: 350   },
    { name: "3D Rendering",              unit: "render",     price: 450   },
    { name: "Project Management",        unit: "hour",       price: 150   },
    { name: "Staging",                   unit: "room",       price: 800   },
  ],
  "🛡️ Pest Control": [
    { name: "General Pest Treatment",    unit: "sq ft",      price: 0.10  },
    { name: "Termite Treatment",         unit: "linear ft",  price: 8     },
    { name: "Mosquito Treatment",        unit: "sq ft",      price: 0.08  },
    { name: "Rodent Control",            unit: "visit",      price: 180   },
    { name: "Bed Bug Treatment",         unit: "room",       price: 350   },
    { name: "Annual Pest Plan",          unit: "year",       price: 850   },
    { name: "PM Fee – Pest Control",     unit: "hour",       price: 75    },
  ],
  "📋 Project Management": [
    { name: "Site Supervision",          unit: "hour",       price: 110   },
    { name: "Project Coordination",      unit: "hour",       price: 95    },
    { name: "Permits & Inspections",     unit: "permit",     price: 350   },
    { name: "Subcontractor Management",  unit: "hour",       price: 125   },
    { name: "Blueprint Review",          unit: "hour",       price: 150   },
    { name: "Schedule Management",       unit: "week",       price: 450   },
    { name: "Progress Reports",          unit: "report",     price: 200   },
    { name: "Budget Tracking",           unit: "month",      price: 600   },
    { name: "Quality Control",           unit: "visit",      price: 275   },
  ],
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const fmt   = (n) => `$${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;
const uid   = () => Math.random().toString(36).slice(2,9);
const today = () => new Date().toISOString().slice(0,10);
const due30 = () => { const d=new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0,10); };

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size=16, color=C.gold }) => {
  const s = size; const c = color;
  const icons = {
    diamond: <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="2" transform="rotate(45 14 14)" stroke={c} strokeWidth="2.5" fill="none"/><rect x="9" y="9" width="10" height="10" rx="1.5" transform="rotate(45 14 14)" fill={c}/></svg>,
    estimate: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
    invoice:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    check:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
    plus:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/></svg>,
    print:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18"/><rect x="6" y="14" width="12" height="8"/></svg>,
    arrow:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>,
    back:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>,
    building: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
    dollar:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  };
  return icons[name] || null;
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function DiamondLogo({ size=30 }) {
  return <Icon name="diamond" size={size} color={C.gold} />;
}

function Logo({ small }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <DiamondLogo size={small ? 22 : 30} />
      <div>
        <div style={{ fontFamily:FONT_DISPLAY, fontSize:small?16:22, fontWeight:900, color:C.white, letterSpacing:"-0.5px", lineHeight:1 }}>
          Swift<span style={{ color:C.gold }}>Book</span>
        </div>
        {!small && <div style={{ fontFamily:FONT_BODY, fontSize:8, color:C.muted, letterSpacing:"2.5px", textTransform:"uppercase", marginTop:3 }}>Quote it. Invoice it. Close it.</div>}
      </div>
    </div>
  );
}

function Header({ view, setView, docCount }) {
  return (
    <header style={{ background:C.black, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 }}>
      <Logo />
      <nav style={{ display:"flex", gap:8 }}>
        <button onClick={()=>setView("list")} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${view==="list"?C.cardBorder:"transparent"}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:FONT_BODY, background:view==="list"?C.card:"transparent", color:view==="list"?C.goldLt:C.muted, transition:"all 0.15s" }}>
          Documents {docCount>0&&`(${docCount})`}
        </button>
        <button onClick={()=>setView("new")} style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:FONT_BODY, background:C.gold, color:C.ink, display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="plus" size={13} color={C.ink} /> New
        </button>
      </nav>
    </header>
  );
}

function Badge({ status }) {
  const map = {
    Paid:     { bg:C.emeraldDk, color:C.emerald, border:C.emeraldBd, label:"✓ Paid"    },
    Invoice:  { bg:"#2A2200",   color:C.goldLt,  border:"#3A3000",   label:"Invoice"   },
    Estimate: { bg:C.card,      color:"#4A90D9", border:C.cardBorder,label:"Estimate"  },
    Signed:   { bg:C.emeraldDk, color:C.emerald, border:C.emeraldBd, label:"✍️ Signed" },
  };
  const b = map[status]||map.Estimate;
  return <span style={{ padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:700, fontFamily:FONT_BODY, background:b.bg, color:b.color, border:`1px solid ${b.border}` }}>{b.label}</span>;
}

function Btn({ children, variant="gold", onClick, disabled, small, icon }) {
  const map = {
    gold:    { bg:C.gold,      color:C.ink     },
    emerald: { bg:C.emeraldDk, color:C.emerald },
    ghost:   { bg:C.surface,   color:C.muted   },
    steel:   { bg:"#1E3A5F",   color:"#4A90D9" },
    danger:  { bg:"#3A0A0A",   color:C.danger  },
  };
  const v = map[variant]||map.gold;
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding:small?"5px 12px":"10px 22px", borderRadius:8, border:"none", cursor:disabled?"not-allowed":"pointer", fontSize:small?11:13, fontWeight:700, fontFamily:FONT_BODY, background:disabled?C.border:v.bg, color:disabled?C.muted:v.color, transition:"all 0.15s", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6, opacity:disabled?0.6:1 }}>
      {icon && <Icon name={icon} size={small?11:13} color={disabled?C.muted:v.color} />}
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:22, marginBottom:18, ...style }}>{children}</div>;
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily:FONT_DISPLAY, fontSize:13, fontWeight:700, color:C.gold, marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:2, height:14, background:C.gold, borderRadius:99 }} />{children}
    </div>
  );
}

const inp = { padding:"9px 13px", borderRadius:8, border:`1px solid #2A2A2A`, fontSize:13, background:"#111", color:C.white, width:"100%", fontFamily:FONT_BODY };

function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, flex:1, minWidth:120 }}>
      {label && <span style={{ fontFamily:FONT_BODY, fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{label}</span>}
      {children}
    </div>
  );
}

function CostMeter({ total }) {
  const pct = Math.min((total/15000)*100,100);
  const col = pct>70?C.gold:C.emerald;
  return (
    <div style={{ background:"#111", border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontFamily:FONT_BODY, fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1.5 }}>Project Value</span>
        <span style={{ fontFamily:FONT_DISPLAY, fontSize:24, fontWeight:700, color:col }}>{fmt(total)}</span>
      </div>
      <div style={{ background:C.border, borderRadius:99, height:4, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:99, width:`${pct}%`, background:col, transition:"width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── SIGNATURE PAD ────────────────────────────────────────────────────────────
function SignaturePad({ onSave, onCancel, isPro }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  }

  function stopDraw(e) { e.preventDefault(); setDrawing(false); }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  }

  function save() {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    const now = new Date();
    onSave({ image: dataURL, signedAt: now.toLocaleString() });
  }

  if (!isPro) return (
    <div style={{ background:C.black, border:`1px solid ${C.border}`, borderRadius:16, padding:"32px 28px", textAlign:"center" }}>
      <div style={{ marginBottom:16 }}><Icon name="dollar" size={36} color={C.gold} /></div>
      <div style={{ fontFamily:FONT_DISPLAY, fontSize:20, fontWeight:700, color:C.white, marginBottom:8 }}>Pro Feature</div>
      <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.muted, marginBottom:24, lineHeight:1.7 }}>
        Client digital signature is available on the <strong style={{ color:C.gold }}>Pro plan</strong> and above.<br/>Upgrade to unlock this feature.
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="gold" icon="arrow" onClick={()=>window.open(STRIPE_LINKS.pro, '_blank')}>Upgrade to Pro →</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"24px", marginTop:20 }}>
      <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.white, marginBottom:4 }}>Client Signature</div>
      <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginBottom:16 }}>Sign below to approve this estimate</div>
      <div style={{ background:"#111", border:`2px dashed ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:14, cursor:"crosshair" }}>
        <canvas
          ref={canvasRef}
          width={700}
          height={160}
          style={{ display:"block", width:"100%", height:160, touchAction:"none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      {!hasStrokes && (
        <div style={{ textAlign:"center", fontFamily:FONT_BODY, fontSize:11, color:C.muted, marginBottom:14 }}>
          ✍️ Draw your signature above with mouse or finger
        </div>
      )}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="ghost" onClick={clear}>Clear</Btn>
        <Btn variant="gold" icon="check" onClick={save} disabled={!hasStrokes}>Confirm Signature</Btn>
      </div>
    </div>
  );
}

// ─── PREVIEW ──────────────────────────────────────────────────────────────────
function Preview({ doc, onBack, onConvert, onPaid, onSign, userPlan }) {
  const [showSigPad, setShowSigPad] = useState(false);
  const isPro = userPlan === "pro" || userPlan === "business";

  return (
    <div style={{ background:"#111", minHeight:"100vh" }}>
      <div style={{ maxWidth:820, margin:"0 auto", padding:"28px 16px" }}>
        <div className="no-print" style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
          <Btn variant="ghost" icon="back" onClick={onBack}>Back</Btn>
          {doc.type==="Estimate" && !doc.signature && <Btn variant="steel" icon="invoice" onClick={onConvert}>Convert to Invoice</Btn>}
          {doc.type==="Estimate" && !doc.signature && <Btn variant="ghost" onClick={()=>setShowSigPad(!showSigPad)}>✍️ Request Signature</Btn>}
          {doc.type==="Invoice" && doc.status!=="Paid" && <Btn variant="emerald" icon="check" onClick={onPaid}>Mark as Paid</Btn>}
          <Btn variant="ghost" icon="print" onClick={()=>window.print()}>Print / PDF</Btn>
        </div>

        {/* Signature pad */}
        {showSigPad && (
          <SignaturePad
            isPro={isPro}
            onCancel={()=>setShowSigPad(false)}
            onSave={(sig)=>{ onSign(doc.id, sig); setShowSigPad(false); }}
          />
        )}

        <div style={{ background:C.surface, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}` }}>
          <div style={{ background:C.black, padding:"26px 32px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:20, borderBottom:`1px solid ${C.border}` }}>
            <div>
              <div style={{ marginBottom:10 }}><Logo small /></div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.white }}>{doc.company.name}</div>
              <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginTop:2 }}>{doc.company.phone}{doc.company.email?` · ${doc.company.email}`:""}</div>
              <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted }}>{doc.company.address}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:FONT_BODY, fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:2 }}>{doc.type}</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:28, fontWeight:900, color:C.gold }}>{doc.number}</div>
              <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.dim, marginTop:4 }}>Date: {doc.date}</div>
              <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.dim }}>Due: {doc.due}</div>
              <div style={{ marginTop:8 }}><Badge status={doc.status}/></div>
            </div>
          </div>
          <div style={{ padding:"26px 32px" }}>
            <div style={{ background:"#111", border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px", marginBottom:24 }}>
              <div style={{ fontFamily:FONT_BODY, fontSize:9, color:C.gold, textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>Bill To</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.white }}>{doc.client.name}</div>
              {doc.client.projectName && <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.emerald, fontWeight:600, marginTop:2 }}>Project: {doc.client.projectName}</div>}
              <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginTop:2 }}>{doc.client.email}{doc.client.phone?` · ${doc.client.phone}`:""}</div>
              <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted }}>{doc.client.address}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 110px", gap:8, paddingBottom:8, borderBottom:`2px solid ${C.gold}`, marginBottom:4 }}>
              {["Service","Qty × Rate","Amount"].map((h,i)=>(
                <span key={h} style={{ fontFamily:FONT_BODY, fontSize:9, fontWeight:800, color:C.gold, textTransform:"uppercase", letterSpacing:1.5, textAlign:i===2?"right":"left" }}>{h}</span>
              ))}
            </div>
            {doc.items.map((item,idx)=>(
              <div key={item.id} style={{ display:"grid", gridTemplateColumns:"1fr 140px 110px", gap:8, padding:"10px 0", borderBottom:`1px solid #1A1A1A`, background:idx%2===0?"transparent":"#0A0A0A" }}>
                <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white }}>{item.name}</span>
                <span style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted }}>{item.qty} × {fmt(item.price)}</span>
                <span style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.goldLt, textAlign:"right" }}>{fmt(item.qty*item.price)}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
              <div style={{ width:280 }}>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontFamily:FONT_BODY, fontSize:12, color:C.muted, borderBottom:`1px solid ${C.border}` }}>
                  <span>Subtotal</span><span>{fmt(doc.subtotal)}</span>
                </div>
                {doc.tax>0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontFamily:FONT_BODY, fontSize:12, color:C.muted, borderBottom:`1px solid ${C.border}` }}>
                  <span>Tax ({doc.tax}%)</span><span>{fmt(doc.taxAmt)}</span>
                </div>}
                <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, padding:"16px 20px", marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontFamily:FONT_BODY, fontSize:9, color:C.emerald, textTransform:"uppercase", letterSpacing:2 }}>Total Due</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:30, fontWeight:900, color:C.gold }}>{fmt(doc.total)}</div>
                </div>
              </div>
            </div>
            {doc.notes && <div style={{ marginTop:22, padding:"14px 18px", background:"#111", border:`1px solid ${C.border}`, borderRadius:10, fontFamily:FONT_BODY, fontSize:12, color:C.muted }}><strong style={{ color:C.white }}>Notes: </strong>{doc.notes}</div>}

            {/* Signature display */}
            {doc.signature && (
              <div style={{ marginTop:24, padding:"18px 20px", background:C.emeraldDk, border:`1px solid ${C.emeraldBd}`, borderRadius:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                  <div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:9, color:C.emerald, textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>✅ Approved & Signed</div>
                    <img src={doc.signature.image} alt="Client Signature" style={{ height:60, background:"transparent", display:"block", marginBottom:6 }} />
                    <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.emerald }}>{doc.client.name}</div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.muted }}>{doc.signature.signedAt}</div>
                  </div>
                  <div style={{ background:C.emeraldDk, border:`1px solid ${C.emeraldBd}`, borderRadius:10, padding:"10px 16px", textAlign:"center" }}>
                    <Icon name="check" size={20} color={C.emerald} />
                    <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.emerald, marginTop:4, fontWeight:700 }}>SIGNED</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop:28, paddingTop:16, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <DiamondLogo size={14} />
              <span style={{ fontFamily:FONT_BODY, fontSize:10, color:C.dim }}>SwiftBook · Your jobs. Your money. · getswiftbook.app</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOC LIST ─────────────────────────────────────────────────────────────────
function DocList({ docs, onNew, onView, onConvert, onPaid }) {
  const total   = docs.reduce((a,d)=>a+d.total,0);
  const paid    = docs.filter(d=>d.status==="Paid").reduce((a,d)=>a+d.total,0);
  const pending = docs.filter(d=>d.status==="Invoice").reduce((a,d)=>a+d.total,0);
  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 16px" }}>
      {docs.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
          {[{label:"Total Quoted",value:fmt(total),color:"#4A90D9",icon:"estimate"},{label:"Collected",value:fmt(paid),color:C.emerald,icon:"check"},{label:"Pending",value:fmt(pending),color:C.gold,icon:"dollar"}].map(s=>(
            <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px" }}>
              <div style={{ fontFamily:FONT_BODY, fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                <Icon name={s.icon} size={11} color={s.color} />{s.label}
              </div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:24, fontWeight:700, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ fontFamily:FONT_DISPLAY, fontSize:18, fontWeight:700, color:C.white }}>All Documents</span>
        <Btn variant="gold" icon="plus" onClick={onNew}>New Document</Btn>
      </div>
      {docs.length===0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", border:`1px dashed ${C.border}`, borderRadius:16, background:C.surface }}>
          <div style={{ marginBottom:16 }}><DiamondLogo size={44} /></div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:20, fontWeight:700, color:C.white, marginBottom:8 }}>Ready to close your first job?</div>
          <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.muted, marginBottom:24 }}>Create a professional estimate in under 2 minutes.</div>
          <Btn variant="gold" icon="estimate" onClick={onNew}>Create First Estimate</Btn>
        </div>
      ) : docs.map(doc=>(
        <div key={doc.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
              <Icon name={doc.type==="Estimate"?"estimate":"invoice"} size={14} color={doc.type==="Estimate"?"#4A90D9":C.gold} />
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15, color:C.white }}>{doc.number}</span>
              <Badge status={doc.status}/>
              {doc.signature && <span style={{ padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700, background:C.emeraldDk, color:C.emerald, border:`1px solid ${C.emeraldBd}` }}>✍️ Signed</span>}
            </div>
            <div style={{ fontFamily:FONT_BODY, fontSize:13, fontWeight:600, color:C.white }}>{doc.client.name||"No client"}</div>
            <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted, marginTop:2 }}>{doc.client.projectName&&`${doc.client.projectName} · `}{doc.date}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:22, fontWeight:700, color:C.gold }}>{fmt(doc.total)}</div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn small variant="ghost" onClick={()=>onView(doc)}>View</Btn>
              {doc.type==="Estimate" && <Btn small variant="steel" icon="arrow" onClick={()=>onConvert(doc)}>Invoice</Btn>}
              {doc.type==="Invoice" && doc.status!=="Paid" && <Btn small variant="emerald" icon="check" onClick={()=>onPaid(doc.id)}>Paid</Btn>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NEW DOC ──────────────────────────────────────────────────────────────────
function NewDoc({ onSave, onCancel, docCount }) {
  const [docType, setDocType] = useState("Estimate");
  const [company, setCompany] = useState({ name:"Green Point by Mijo", industry:Object.keys(INDUSTRIES)[0], phone:"", email:"", address:"" });
  const [client, setClient]   = useState({ name:"", phone:"", email:"", address:"", projectName:"" });
  const [items, setItems]     = useState([]);
  const [newItem, setNewItem] = useState({ service:"", custom:"", qty:"", price:"" });
  const [tax, setTax]         = useState(0);
  const [notes, setNotes]     = useState("");

  const services  = INDUSTRIES[company.industry]||[];
  const subtotal  = items.reduce((a,i)=>a+i.qty*i.price,0);
  const taxAmt    = subtotal*(tax/100);
  const total     = subtotal+taxAmt;
  const selSvc    = services.find(s=>s.name===newItem.service);
  const row       = { display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" };

  function addItem() {
    const svc  = services.find(s=>s.name===newItem.service);
    const name = newItem.service==="__custom__"?newItem.custom:newItem.service;
    const price= parseFloat(newItem.price)||(svc?.price||0);
    const qty  = parseFloat(newItem.qty)||1;
    if(!name) return;
    setItems([...items,{id:uid(),name,qty,price,unit:svc?.unit||"unit"}]);
    setNewItem({service:"",custom:"",qty:"",price:""});
  }

  function save() {
    const doc = {
      id:uid(), type:docType,
      status:docType==="Invoice"?"Invoice":"Estimate",
      date:today(), due:due30(),
      company:{...company}, client:{...client},
      items:[...items], subtotal, taxAmt, tax, total, notes,
      number:`${docType==="Invoice"?"INV":"EST"}-${String(docCount+1).padStart(4,"0")}`,
    };
    onSave(doc);
  }

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 16px" }}>
      <div style={{ display:"flex", gap:10, marginBottom:22 }}>
        {["Estimate","Invoice"].map(t=>(
          <button key={t} onClick={()=>setDocType(t)} style={{ padding:"10px 24px", borderRadius:10, cursor:"pointer", fontFamily:FONT_BODY, fontSize:13, fontWeight:700, background:docType===t?C.gold:C.surface, color:docType===t?C.ink:C.muted, border:`1px solid ${docType===t?C.gold:C.border}`, display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
            <Icon name={t==="Estimate"?"estimate":"invoice"} size={14} color={docType===t?C.ink:C.muted} />
            {t}
          </button>
        ))}
      </div>

      <Card>
        <SectionTitle>Your Company</SectionTitle>
        <div style={row}>
          <Field label="Company Name"><input style={inp} value={company.name} onChange={e=>setCompany({...company,name:e.target.value})} placeholder="Your business name"/></Field>
          <Field label="Industry">
            <select style={{...inp,cursor:"pointer"}} value={company.industry} onChange={e=>setCompany({...company,industry:e.target.value})}>
              {Object.keys(INDUSTRIES).map(k=><option key={k}>{k}</option>)}
            </select>
          </Field>
        </div>
        <div style={row}>
          <Field label="Phone"><input style={inp} value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})} placeholder="(555) 000-0000"/></Field>
          <Field label="Email"><input style={inp} value={company.email} onChange={e=>setCompany({...company,email:e.target.value})} placeholder="you@company.com"/></Field>
          <Field label="Address"><input style={inp} value={company.address} onChange={e=>setCompany({...company,address:e.target.value})} placeholder="City, State"/></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Client Information</SectionTitle>
        <div style={row}>
          <Field label="Client Name"><input style={inp} value={client.name} onChange={e=>setClient({...client,name:e.target.value})} placeholder="Full name"/></Field>
          <Field label="Project Name"><input style={inp} value={client.projectName} onChange={e=>setClient({...client,projectName:e.target.value})} placeholder="e.g. Backyard Renovation"/></Field>
        </div>
        <div style={row}>
          <Field label="Phone"><input style={inp} value={client.phone} onChange={e=>setClient({...client,phone:e.target.value})} placeholder="(555) 000-0000"/></Field>
          <Field label="Email"><input style={inp} value={client.email} onChange={e=>setClient({...client,email:e.target.value})} placeholder="client@email.com"/></Field>
          <Field label="Property Address"><input style={inp} value={client.address} onChange={e=>setClient({...client,address:e.target.value})} placeholder="123 Main St"/></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Services & Line Items</SectionTitle>
        <div style={{ background:"#111", border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:18 }}>
          <div style={{...row,marginBottom:0}}>
            <Field label="Select Service">
              <select style={{...inp,cursor:"pointer"}} value={newItem.service} onChange={e=>{const svc=services.find(s=>s.name===e.target.value);setNewItem({...newItem,service:e.target.value,price:svc?String(svc.price):""})}}>
                <option value="">Choose a service…</option>
                {services.map(s=><option key={s.name}>{s.name}</option>)}
                <option value="__custom__">+ Custom service</option>
              </select>
            </Field>
            {newItem.service==="__custom__" && <Field label="Description"><input style={inp} value={newItem.custom} onChange={e=>setNewItem({...newItem,custom:e.target.value})} placeholder="Describe the service"/></Field>}
            <Field label={selSvc?`Qty (${selSvc.unit})`:"Qty"}>
              <input style={inp} type="number" value={newItem.qty} onChange={e=>setNewItem({...newItem,qty:e.target.value})} placeholder="1"/>
            </Field>
            <Field label="Unit Price ($)">
              <input style={inp} type="number" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})} placeholder={selSvc?String(selSvc.price):"0.00"}/>
            </Field>
            <Field label=" "><Btn variant="gold" icon="plus" onClick={addItem}>Add</Btn></Field>
          </div>
        </div>

        {items.length===0 ? (
          <div style={{ textAlign:"center", padding:"24px 0", fontFamily:FONT_BODY, color:C.muted, fontSize:13 }}>Select a service above to add your first line item</div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 180px 110px 28px", gap:8, paddingBottom:8, borderBottom:`2px solid ${C.gold}`, marginBottom:4 }}>
              {["Service","Unit","Qty × Rate","Total",""].map(h=><span key={h} style={{ fontFamily:FONT_BODY, fontSize:9, fontWeight:800, color:C.gold, textTransform:"uppercase", letterSpacing:1 }}>{h}</span>)}
            </div>
            {items.map(item=>(
              <div key={item.id} style={{ display:"grid", gridTemplateColumns:"1fr 90px 180px 110px 28px", gap:8, alignItems:"center", padding:"10px 0", borderBottom:`1px solid #1A1A1A` }}>
                <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white }}>{item.name}</span>
                <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted }}>{item.unit}</span>
                <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                  <input style={{...inp,width:52,padding:"5px 8px",fontSize:12}} type="number" value={item.qty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,qty:parseFloat(e.target.value)||0}:i))}/>
                  <span style={{ fontFamily:FONT_BODY, color:C.muted, fontSize:11 }}>×</span>
                  <input style={{...inp,width:90,padding:"5px 8px",fontSize:12}} type="number" value={item.price} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,price:parseFloat(e.target.value)||0}:i))}/>
                </div>
                <span style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.gold }}>{fmt(item.qty*item.price)}</span>
                <button onClick={()=>setItems(items.filter(i=>i.id!==item.id))} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center" }}>
                  <Icon name="trash" size={14} color={C.danger}/>
                </button>
              </div>
            ))}
          </>
        )}

        {items.length>0 && (
          <>
            <div style={{ height:16 }}/>
            <CostMeter total={total}/>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <Field label="Tax (%)"><input style={{...inp,maxWidth:120}} type="number" value={tax} onChange={e=>setTax(parseFloat(e.target.value)||0)} placeholder="0"/></Field>
              <Field label="Notes / Payment Terms"><input style={inp} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Payment due upon completion. Thank you!"/></Field>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, padding:"18px 22px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
              <div>
                <div style={{ fontFamily:FONT_BODY, fontSize:11, color:"#4A90D9" }}>Subtotal: {fmt(subtotal)}</div>
                {tax>0 && <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted }}>Tax ({tax}%): {fmt(taxAmt)}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:FONT_BODY, fontSize:9, color:C.emerald, textTransform:"uppercase", letterSpacing:2 }}>Total</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:32, fontWeight:900, color:C.gold }}>{fmt(total)}</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="gold" icon="arrow" onClick={save} disabled={items.length===0||!client.name}>Save {docType}</Btn>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: "diamond",
      title: "Welcome to SwiftBook",
      subtitle: "Quote it. Invoice it. Close it.",
      desc: "The professional estimating platform built for contractors across 12 industries. Let's get you set up in 3 quick steps.",
      action: "Get Started →",
    },
    {
      icon: "building",
      title: "Set up your company",
      subtitle: "Step 1 of 3",
      desc: "Add your company name, industry, logo and contact info. This appears on every estimate and invoice you send.",
      action: "Next →",
    },
    {
      icon: "estimate",
      title: "Create your first estimate",
      subtitle: "Step 2 of 3",
      desc: "Pick your industry, select services from our pre-loaded catalog, and SwiftBook calculates everything automatically.",
      action: "Next →",
    },
    {
      icon: "invoice",
      title: "Convert & get paid",
      subtitle: "Step 3 of 3",
      desc: "Once your client approves, convert your estimate to an invoice with one click. Mark it paid when the money arrives.",
      action: "Start SwiftBook →",
    },
  ];
  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ minHeight:"100vh", background:C.black, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:480, width:"100%" }}>
        {/* Progress dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:40 }}>
          {steps.map((_,i) => (
            <div key={i} style={{ width: i===step?24:8, height:8, borderRadius:99, background:i===step?C.gold:C.border, transition:"all 0.3s" }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"48px 40px", textAlign:"center" }}>
          {/* Icon */}
          <div style={{ width:72, height:72, background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 28px" }}>
            <Icon name={s.icon} size={32} color={C.gold} />
          </div>

          {/* Step label */}
          {step > 0 && (
            <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.emerald, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>{s.subtitle}</div>
          )}

          {/* Title */}
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:28, fontWeight:900, color:C.white, marginBottom:8, lineHeight:1.2 }}>{s.title}</div>
          {step === 0 && <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:2, marginBottom:20 }}>{s.subtitle}</div>}

          {/* Description */}
          <div style={{ fontFamily:FONT_BODY, fontSize:14, color:C.muted, lineHeight:1.7, marginBottom:36 }}>{s.desc}</div>

          {/* Plan badges — only on step 0 */}
          {step === 0 && (
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:32 }}>
              {[{label:"Starter", price:"$24.99"},{label:"Pro", price:"$49.99"},{label:"Business", price:"$99.99"}].map(p=>(
                <div key={p.label} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:10, padding:"10px 14px", flex:1 }}>
                  <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.muted, marginBottom:4 }}>{p.label}</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.gold }}>{p.price}</div>
                  <div style={{ fontFamily:FONT_BODY, fontSize:9, color:C.muted }}>/ month</div>
                </div>
              ))}
            </div>
          )}

          {/* Feature list — steps 1-3 */}
          {step === 1 && (
            <div style={{ textAlign:"left", marginBottom:28 }}>
              {["Company name & industry","Phone, email & address","Upload your logo","Pre-loaded service catalog"].map(f=>(
                <div key={f} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <Icon name="check" size={14} color={C.emerald} />
                  <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white }}>{f}</span>
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div style={{ textAlign:"left", marginBottom:28 }}>
              {["12 industries available","Pre-loaded pricing catalog","Edit quantities & prices","Real-time cost meter"].map(f=>(
                <div key={f} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <Icon name="check" size={14} color={C.emerald} />
                  <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white }}>{f}</span>
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div style={{ textAlign:"left", marginBottom:28 }}>
              {["Convert estimate → invoice in 1 click","Client digital signature","Mark as paid instantly","Print or save as PDF"].map(f=>(
                <div key={f} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <Icon name="check" size={14} color={C.emerald} />
                  <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <button onClick={() => isLast ? onComplete() : setStep(step+1)} style={{ width:"100%", padding:"14px 24px", borderRadius:12, border:"none", cursor:"pointer", fontFamily:FONT_BODY, fontSize:15, fontWeight:800, background:C.gold, color:C.ink, transition:"all 0.15s" }}>
            {s.action}
          </button>

          {/* Skip */}
          {!isLast && (
            <button onClick={onComplete} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginTop:16, display:"block", width:"100%" }}>
              Skip intro
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:24, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <DiamondLogo size={14} />
          <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.dim }}>getswiftbook.app</span>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ onBack }) {
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState({ name:"Green Point by Mijo", industry:Object.keys(INDUSTRIES)[0], phone:"", email:"", address:"", website:"" });
  const [logo, setLogo] = useState(null);
  const [plan, setPlan] = useState("starter");
  const [saved, setSaved] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const tabs = [
    { id:"company", label:"Company",      icon:"building" },
    { id:"plan",    label:"Subscription", icon:"dollar"   },
    { id:"support", label:"Support",      icon:"estimate" },
  ];

  const plans = [
    { id:"starter",  label:"Starter",  price:"$24.99", users:"1 user",  color:C.steel },
    { id:"pro",      label:"Pro",      price:"$49.99", users:"3 users", color:C.gold  },
    { id:"business", label:"Business", price:"$99.99", users:"10 users",color:C.emerald },
  ];

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 16px" }}>
      {/* Back */}
      <div style={{ marginBottom:24 }}>
        <Btn variant="ghost" icon="back" onClick={onBack}>Back</Btn>
      </div>

      <div style={{ fontFamily:FONT_DISPLAY, fontSize:22, fontWeight:700, color:C.white, marginBottom:24 }}>Settings</div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"10px 20px", background:"none", border:"none", borderBottom:`2px solid ${tab===t.id?C.gold:"transparent"}`, cursor:"pointer", fontFamily:FONT_BODY, fontSize:12, fontWeight:700, color:tab===t.id?C.gold:C.muted, display:"flex", alignItems:"center", gap:6, marginBottom:-1, transition:"all 0.15s" }}>
            <Icon name={t.icon} size={13} color={tab===t.id?C.gold:C.muted} />
            {t.label}
          </button>
        ))}
      </div>

      {/* COMPANY TAB */}
      {tab==="company" && (
        <div>
          <Card>
            <SectionTitle>Company Logo</SectionTitle>
            <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
              <div style={{ width:90, height:90, background:C.card, border:`2px dashed ${logo?C.gold:C.border}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
                {logo ? <img src={logo} alt="logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} /> : <Icon name="building" size={28} color={C.muted} />}
              </div>
              <div>
                <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white, marginBottom:8, fontWeight:600 }}>Upload your company logo</div>
                <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted, marginBottom:12 }}>PNG or JPG — appears on all your documents</div>
                <label style={{ padding:"8px 18px", background:C.gold, color:C.ink, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>
                  Choose File
                  <input type="file" accept="image/*" onChange={handleLogo} style={{ display:"none" }} />
                </label>
                {logo && <button onClick={()=>setLogo(null)} style={{ marginLeft:10, background:"none", border:"none", color:C.danger, fontSize:12, cursor:"pointer", fontFamily:FONT_BODY }}>Remove</button>}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Company Information</SectionTitle>
            <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
              <Field label="Company Name"><input style={inp} value={company.name} onChange={e=>setCompany({...company,name:e.target.value})} /></Field>
              <Field label="Industry">
                <select style={{...inp,cursor:"pointer"}} value={company.industry} onChange={e=>setCompany({...company,industry:e.target.value})}>
                  {Object.keys(INDUSTRIES).map(k=><option key={k}>{k}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
              <Field label="Phone"><input style={inp} value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})} placeholder="(555) 000-0000" /></Field>
              <Field label="Email"><input style={inp} value={company.email} onChange={e=>setCompany({...company,email:e.target.value})} placeholder="you@company.com" /></Field>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <Field label="Address"><input style={inp} value={company.address} onChange={e=>setCompany({...company,address:e.target.value})} placeholder="City, State" /></Field>
              <Field label="Website"><input style={inp} value={company.website} onChange={e=>setCompany({...company,website:e.target.value})} placeholder="www.yourcompany.com" /></Field>
            </div>
          </Card>

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", alignItems:"center" }}>
            {saved && <span style={{ fontFamily:FONT_BODY, fontSize:12, color:C.emerald, display:"flex", alignItems:"center", gap:6 }}><Icon name="check" size={13} color={C.emerald} /> Saved successfully</span>}
            <Btn variant="gold" icon="check" onClick={save}>Save Changes</Btn>
          </div>
        </div>
      )}

      {/* PLAN TAB */}
      {tab==="plan" && (
        <div>
          <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.muted, marginBottom:20 }}>
            Current plan: <strong style={{ color:C.gold }}>Starter — $24.99/mo</strong>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
            {plans.map(p => (
              <div key={p.id} onClick={()=>setPlan(p.id)} style={{ background:plan===p.id?C.card:C.surface, border:`2px solid ${plan===p.id?p.color:C.border}`, borderRadius:12, padding:"18px 22px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:40, height:40, background:C.black, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${plan===p.id?p.color:C.border}` }}>
                    <Icon name="dollar" size={18} color={p.color} />
                  </div>
                  <div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.white }}>{p.label}</div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted, marginTop:2 }}>{p.users} · Unlimited estimates & invoices</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:20, fontWeight:700, color:p.color }}>{p.price}</div>
                  <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.muted }}>per month</div>
                </div>
              </div>
            ))}
          </div>
          <Btn variant="gold" onClick={()=>window.open(STRIPE_LINKS[plan], '_blank')} icon="arrow">Upgrade Plan</Btn>

          {/* Cancel */}
          <div style={{ marginTop:32, paddingTop:24, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:15, fontWeight:700, color:C.white, marginBottom:6 }}>Cancel Subscription</div>
            <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginBottom:14 }}>You will lose access at the end of your current billing period. This action cannot be undone.</div>
            {!showCancel ? (
              <Btn variant="danger" onClick={()=>setShowCancel(true)}>Cancel Subscription</Btn>
            ) : (
              <div style={{ background:"#1A0000", border:`1px solid #3A0000`, borderRadius:12, padding:"18px 20px" }}>
                <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.white, marginBottom:14, fontWeight:600 }}>⚠️ Are you sure you want to cancel?</div>
                <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginBottom:16 }}>You'll lose access to all your documents and data at the end of your billing period.</div>
                <div style={{ display:"flex", gap:10 }}>
                  <Btn variant="ghost" onClick={()=>setShowCancel(false)}>Keep my account</Btn>
                  <Btn variant="danger" onClick={()=>setShowCancel(false)}>Yes, cancel</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT TAB */}
      {tab==="support" && (
        <div>
          <Card>
            <SectionTitle>Contact Support</SectionTitle>
            <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.7 }}>
              Our team responds within 72 hours. For faster support, upgrade to Pro (24hrs) or Business (12hrs).
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
              <Field label="Your Name"><input style={inp} placeholder="Full name" /></Field>
              <Field label="Email"><input style={inp} placeholder="your@email.com" /></Field>
            </div>
            <Field label="Subject"><input style={{...inp,marginBottom:12}} placeholder="Describe your issue briefly" /></Field>
            <Field label="Message">
              <textarea style={{...inp,height:100,resize:"vertical"}} placeholder="Tell us what's happening..." />
            </Field>
            <div style={{ marginTop:14 }}>
              <Btn variant="gold" icon="arrow">Send Message</Btn>
            </div>
          </Card>

          {/* FAQ */}
          <Card>
            <SectionTitle>Quick Help</SectionTitle>
            {[
              { q:"How do I add my logo?", a:"Go to Settings → Company → Upload your logo. It will appear on all your documents automatically." },
              { q:"How do I convert an estimate to an invoice?", a:"Open any estimate, tap 'Convert to Invoice' — it takes one click." },
              { q:"How do I mark an invoice as paid?", a:"Open the invoice and tap the 'Mark as Paid' button. The status updates instantly." },
              { q:"Can I edit a saved estimate?", a:"Currently you can view and convert estimates. Full editing is coming in the next update." },
              { q:"How do I change my subscription plan?", a:"Go to Settings → Subscription → select your new plan and tap Upgrade." },
            ].map((item,i) => (
              <div key={i} style={{ padding:"14px 0", borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontFamily:FONT_BODY, fontSize:13, fontWeight:700, color:C.white, marginBottom:4 }}>{item.q}</div>
                <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, lineHeight:1.6 }}>{item.a}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── UPDATED HEADER with Settings ─────────────────────────────────────────────
function HeaderFull({ view, setView, docCount, user, onLogout }) {
  return (
    <header style={{ background:C.black, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 }}>
      <Logo />
      <nav style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={()=>setView("list")} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${view==="list"?C.cardBorder:"transparent"}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:FONT_BODY, background:view==="list"?C.card:"transparent", color:view==="list"?C.goldLt:C.muted, transition:"all 0.15s" }}>
          Documents {docCount>0&&`(${docCount})`}
        </button>
        <button onClick={()=>setView("pricing")} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${view==="pricing"?C.gold:"transparent"}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:FONT_BODY, background:"transparent", color:view==="pricing"?C.gold:C.muted, transition:"all 0.15s" }}>
          Plans
        </button>
        <button onClick={()=>setView("new")} style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:FONT_BODY, background:C.gold, color:C.ink, display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="plus" size={13} color={C.ink} /> New
        </button>
        <button onClick={()=>setView("settings")} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${view==="settings"?C.gold:C.border}`, cursor:"pointer", background:view==="settings"?C.card:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={view==="settings"?C.gold:C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        {user && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:4, paddingLeft:12, borderLeft:`1px solid ${C.border}` }}>
            <div style={{ width:32, height:32, borderRadius:8, background:C.card, border:`1px solid ${C.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_DISPLAY, fontSize:13, fontWeight:700, color:C.gold }}>
              {user.company?.[0]?.toUpperCase()||"S"}
            </div>
            <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT_BODY, fontSize:11, color:C.muted, padding:0 }}>Sign out</button>
          </div>
        )}
      </nav>
    </header>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function Login({ onLogin, onRegister }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState(Object.keys(INDUSTRIES)[0]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const key = `user:${email.toLowerCase().trim()}`;
    const user = await DB.get(key);
    if (!user) { setError("Account not found. Please register."); setLoading(false); return; }
    if (user.password !== password) { setError("Incorrect password. Try again."); setLoading(false); return; }
    setLoading(false);
    onLogin(user);
  }

  async function handleRegister() {
    if (!email || !password || !company) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const key = `user:${email.toLowerCase().trim()}`;
    const existing = await DB.get(key);
    if (existing) { setError("Email already registered. Please login."); setLoading(false); return; }
    const user = { id: uid(), email: email.toLowerCase().trim(), password, company, industry, plan:"starter", createdAt: today() };
    await DB.set(key, user);
    setLoading(false);
    onRegister(user);
  }

  return (
    <div style={{ minHeight:"100vh", background:C.black, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:420, width:"100%" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
            <DiamondLogo size={36} />
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:28, fontWeight:900, color:C.white }}>
              Swift<span style={{ color:C.gold }}>Book</span>
            </div>
          </div>
          <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:2 }}>
            Quote it. Invoice it. Close it.
          </div>
        </div>

        {/* Card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"32px 28px" }}>
          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:28, background:C.black, borderRadius:10, padding:4 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:FONT_BODY, fontSize:12, fontWeight:700, background:mode===m?C.gold:"transparent", color:mode===m?C.ink:C.muted, transition:"all 0.15s", textTransform:"capitalize" }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === "register" && (
            <>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontFamily:FONT_BODY, fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Company Name</div>
                <input style={inp} value={company} onChange={e=>setCompany(e.target.value)} placeholder="Your business name" />
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontFamily:FONT_BODY, fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Industry</div>
                <select style={{...inp,cursor:"pointer"}} value={industry} onChange={e=>setIndustry(e.target.value)}>
                  {Object.keys(INDUSTRIES).map(k=><option key={k}>{k}</option>)}
                </select>
              </div>
            </>
          )}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:FONT_BODY, fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Email</div>
            <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:FONT_BODY, fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Password</div>
            <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 characters" />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:"#1A0000", border:`1px solid #3A0000`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontFamily:FONT_BODY, fontSize:12, color:C.danger }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <button onClick={mode==="login"?handleLogin:handleRegister} disabled={loading} style={{ width:"100%", padding:"13px 24px", borderRadius:10, border:"none", cursor:loading?"not-allowed":"pointer", fontFamily:FONT_BODY, fontSize:14, fontWeight:800, background:loading?C.border:C.gold, color:loading?C.muted:C.ink, transition:"all 0.15s" }}>
            {loading ? "Please wait..." : mode==="login" ? "Sign In →" : "Create Account →"}
          </button>

          {/* Plan info on register */}
          {mode === "register" && (
            <div style={{ marginTop:16, padding:"12px 14px", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:8, fontFamily:FONT_BODY, fontSize:11, color:C.muted, textAlign:"center" }}>
              🎉 Start free — no credit card required<br/>
              <span style={{ color:C.gold }}>Starter plan included</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:20, fontFamily:FONT_BODY, fontSize:10, color:C.dim }}>
          getswiftbook.app · Your jobs. Your money.
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function SwiftBook() {
  const [appState, setAppState] = useState("loading"); // loading | login | onboarding | app
  const [user, setUser]         = useState(null);
  const [view, setView]         = useState("list");
  const [docs, setDocs]         = useState([]);
  const [previewDoc, setPreview]= useState(null);

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    input,select{font-family:'Inter',system-ui,sans-serif;color:#FFF;}
    input::placeholder{color:#444;}
    select option{background:#1A1A1A;color:#FFF;}
    textarea{font-family:'Inter',system-ui,sans-serif;color:#FFF;background:#111;border:1px solid #2A2A2A;border-radius:8px;padding:9px 13px;width:100%;}
    textarea::placeholder{color:#444;}
    @media print{.no-print{display:none!important;}body{background:white;}}
  `;

  // ── Load session on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadSession() {
      const session = await DB.get("session:current");
      if (session) {
        setUser(session);
        const savedDocs = await DB.get(`docs:${session.id}`) || [];
        setDocs(savedDocs);
        setAppState("app");
      } else {
        setAppState("login");
      }
    }
    loadSession();
  }, []);

  // ── Save docs whenever they change ────────────────────────────────────────
  useEffect(() => {
    if (user && docs.length >= 0) {
      DB.set(`docs:${user.id}`, docs);
    }
  }, [docs, user]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  async function handleLogin(u) {
    await DB.set("session:current", u);
    const savedDocs = await DB.get(`docs:${u.id}`) || [];
    setDocs(savedDocs);
    setUser(u);
    setAppState("app");
  }

  async function handleRegister(u) {
    await DB.set("session:current", u);
    setUser(u);
    setDocs([]);
    setAppState("onboarding");
  }

  async function handleLogout() {
    await DB.delete("session:current");
    setUser(null);
    setDocs([]);
    setView("list");
    setAppState("login");
  }

  // ── Doc handlers ──────────────────────────────────────────────────────────
  function saveDoc(doc) { setDocs(prev => [doc, ...prev]); setView("list"); }

  function convertToInvoice(doc) {
    const inv = { ...doc, id:uid(), type:"Invoice", status:"Invoice", date:today(), due:due30(), number:`INV-${String(docs.length+1).padStart(4,"0")}` };
    setDocs(prev => [inv, ...prev]);
  }

  function markPaid(id) { setDocs(prev => prev.map(d => d.id===id ? {...d,status:"Paid"} : d)); }
  function openPreview(doc) { setPreview(doc); setView("preview"); }
  function signDoc(id, sig) { setDocs(prev => prev.map(d => d.id===id ? {...d, signature:sig, status:"Signed"} : d)); }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (appState === "loading") return (
    <div style={{ minHeight:"100vh", background:C.black, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_BODY }}>
      <style>{STYLES}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ marginBottom:20 }}><DiamondLogo size={44} /></div>
        <div style={{ fontFamily:FONT_DISPLAY, fontSize:22, fontWeight:700, color:C.white }}>Swift<span style={{ color:C.gold }}>Book</span></div>
        <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, marginTop:8 }}>Loading your workspace...</div>
      </div>
    </div>
  );

  // ── Login ──────────────────────────────────────────────────────────────────
  if (appState === "login") return (
    <div style={{ fontFamily:FONT_BODY }}>
      <style>{STYLES}</style>
      <Login onLogin={handleLogin} onRegister={handleRegister} />
    </div>
  );

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (appState === "onboarding") return (
    <div style={{ fontFamily:FONT_BODY }}>
      <style>{STYLES}</style>
      <Onboarding onComplete={()=>setAppState("app")} />
    </div>
  );

  // ── Trial days remaining ───────────────────────────────────────────────────
  const trialDaysLeft = user ? (() => {
    const created = new Date(user.createdAt);
    const now = new Date();
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return Math.max(0, 14 - diff);
  })() : 14;

  const isTrialExpired = trialDaysLeft === 0 && user?.plan === "starter" && !user?.subscribed;

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#111", fontFamily:FONT_BODY, color:C.white }}>
      <style>{STYLES}</style>
      <div className="no-print">
        <HeaderFull view={view} setView={setView} docCount={docs.length} user={user} onLogout={handleLogout} />
        {/* Trial banner */}
        {!isTrialExpired && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
          <div style={{ background:`linear-gradient(90deg, #1A1A00, #2A2200)`, borderBottom:`1px solid #3A3000`, padding:"10px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.goldLt }}>
              ⚡ <strong>{trialDaysLeft} days left</strong> on your free trial
            </div>
            <button onClick={()=>window.open(STRIPE_LINKS.starter, '_blank')} style={{ padding:"5px 14px", background:C.gold, color:C.ink, border:"none", borderRadius:6, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:FONT_BODY }}>
              Upgrade Now →
            </button>
          </div>
        )}
      </div>

      {/* Trial expired wall */}
      {isTrialExpired && view !== "pricing" ? (
        <Pricing onSelect={(plan)=>{ setView("list"); }} onBack={()=>setView("list")} expired />
      ) : (
        <>
          {view==="preview"  && previewDoc && <Preview doc={previewDoc} onBack={()=>setView("list")} onConvert={()=>{convertToInvoice(previewDoc);setView("list");}} onPaid={()=>{markPaid(previewDoc.id);setView("list");}} onSign={signDoc} userPlan={user?.plan||"starter"}/>}
          {view==="list"     && <DocList docs={docs} onNew={()=>setView("new")} onView={openPreview} onConvert={convertToInvoice} onPaid={markPaid} trialDaysLeft={trialDaysLeft} onUpgrade={()=>setView("pricing")}/>}
          {view==="new"      && <NewDoc onSave={saveDoc} onCancel={()=>setView("list")} docCount={docs.length}/>}
          {view==="settings" && <Settings onBack={()=>setView("list")} user={user} onLogout={handleLogout} onUpgrade={()=>setView("pricing")}/>}
          {view==="pricing"  && <Pricing onSelect={(plan)=>setView("list")} onBack={()=>setView("list")} />}
        </>
      )}
    </div>
  );
}

// ─── PRICING SCREEN ───────────────────────────────────────────────────────────
function Pricing({ onSelect, onBack, expired }) {
  const [selected, setSelected] = useState("pro");
  const [billing, setBilling]   = useState("monthly"); // monthly | yearly

  const plans = [
    {
      id:       "starter",
      name:     "Starter",
      icon:     "estimate",
      monthly:  24.99,
      yearly:   19.99,
      color:    "#4A90D9",
      users:    "1 user",
      badge:    null,
      features: [
        "Unlimited estimates",
        "Unlimited invoices",
        "12 industries",
        "Company logo",
        "Scheduling",
        "Print / PDF",
        "Help Center",
        "Email support — 72hrs",
      ],
    },
    {
      id:       "pro",
      name:     "Pro",
      icon:     "dollar",
      monthly:  49.99,
      yearly:   39.99,
      color:    C.gold,
      users:    "3 users",
      badge:    "Most Popular",
      features: [
        "Everything in Starter",
        "3 users",
        "CRM — client profiles",
        "Lead management",
        "Client digital signature",
        "Basic reports",
        "Email support — 24hrs",
      ],
    },
    {
      id:       "business",
      name:     "Business",
      icon:     "building",
      monthly:  99.99,
      yearly:   79.99,
      color:    C.emerald,
      users:    "10 users",
      badge:    null,
      features: [
        "Everything in Pro",
        "10 users",
        "Advanced CRM",
        "Marketing emails",
        "Advanced scheduling",
        "Advanced reports",
        "QuickBooks integration",
        "Email support — 12hrs",
      ],
    },
  ];

  const yearSavings = { starter: 60, pro: 120, business: 240 };

  return (
    <div style={{ minHeight:"100vh", background:C.black, padding:"40px 16px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Back */}
        {!expired && (
          <div style={{ marginBottom:28 }}>
            <Btn variant="ghost" icon="back" onClick={onBack}>Back</Btn>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          {expired && (
            <div style={{ background:"#1A0A00", border:`1px solid #3A1A00`, borderRadius:10, padding:"12px 20px", marginBottom:24, display:"inline-block" }}>
              <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.gold }}>⚡ Your 14-day free trial has ended — choose a plan to continue</span>
            </div>
          )}
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:32, fontWeight:900, color:C.white, marginBottom:8 }}>
            Simple, transparent pricing
          </div>
          <div style={{ fontFamily:FONT_BODY, fontSize:14, color:C.muted, marginBottom:24 }}>
            No hidden fees. Cancel anytime. 14-day free trial on all plans.
          </div>

          {/* Billing toggle */}
          <div style={{ display:"inline-flex", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:4, gap:4 }}>
            {["monthly","yearly"].map(b => (
              <button key={b} onClick={()=>setBilling(b)} style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:FONT_BODY, fontSize:12, fontWeight:700, background:billing===b?C.gold:"transparent", color:billing===b?C.ink:C.muted, transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
                {b === "monthly" ? "Monthly" : "Yearly"}
                {b === "yearly" && <span style={{ background:C.emeraldDk, color:C.emerald, fontSize:9, padding:"2px 6px", borderRadius:99, border:`1px solid ${C.emeraldBd}` }}>Save 20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:32 }}>
          {plans.map(p => {
            const price = billing === "monthly" ? p.monthly : p.yearly;
            const isSel = selected === p.id;
            return (
              <div key={p.id} onClick={()=>setSelected(p.id)} style={{ background:isSel?C.card:C.surface, border:`2px solid ${isSel?p.color:C.border}`, borderRadius:16, padding:"24px 20px", cursor:"pointer", transition:"all 0.2s", position:"relative", overflow:"hidden" }}>

                {/* Badge */}
                {p.badge && (
                  <div style={{ position:"absolute", top:0, right:0, background:C.gold, color:C.ink, fontSize:9, fontWeight:800, padding:"4px 12px", borderRadius:"0 14px 0 10px", fontFamily:FONT_BODY, letterSpacing:1 }}>
                    {p.badge}
                  </div>
                )}

                {/* Icon + Name */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:38, height:38, background:C.black, border:`1px solid ${isSel?p.color:C.border}`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name={p.icon} size={18} color={p.color} />
                  </div>
                  <div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.white }}>{p.name}</div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:10, color:C.muted }}>{p.users}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontSize:36, fontWeight:900, color:p.color }}>${price}</span>
                    <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted }}>/mo</span>
                  </div>
                  {billing === "yearly" && (
                    <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.emerald, marginTop:2 }}>
                      Save ${yearSavings[p.id]}/year
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{ marginBottom:20 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"5px 0" }}>
                      <div style={{ marginTop:1, flexShrink:0 }}><Icon name="check" size={12} color={isSel?p.color:C.muted} /></div>
                      <span style={{ fontFamily:FONT_BODY, fontSize:12, color:isSel?C.white:C.muted, lineHeight:1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button onClick={e=>{ e.stopPropagation(); window.open(STRIPE_LINKS[p.id], '_blank'); }} style={{ width:"100%", padding:"11px 0", borderRadius:10, border:`2px solid ${p.color}`, cursor:"pointer", fontFamily:FONT_BODY, fontSize:13, fontWeight:800, background:isSel?p.color:"transparent", color:isSel?C.ink:p.color, transition:"all 0.15s" }}>
                  {isSel ? "Subscribe Now →" : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Stripe badge */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 18px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted }}>Secured by </span>
            <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.white, fontWeight:700 }}>Stripe</span>
            <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.muted }}>· 256-bit SSL encryption</span>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.white }}>Full feature comparison</div>
          </div>
          {[
            { feature:"Estimates & Invoices",    starter:"Unlimited", pro:"Unlimited",  business:"Unlimited"  },
            { feature:"Industries",              starter:"12",        pro:"12",          business:"12"         },
            { feature:"Users",                   starter:"1",         pro:"3",           business:"10"         },
            { feature:"Company logo",            starter:"✓",         pro:"✓",           business:"✓"          },
            { feature:"Scheduling",              starter:"Basic",     pro:"Advanced",    business:"Advanced"   },
            { feature:"CRM",                     starter:"—",         pro:"✓",           business:"Advanced"   },
            { feature:"Lead Management",         starter:"—",         pro:"✓",           business:"✓"          },
            { feature:"Client Signature",        starter:"—",         pro:"✓",           business:"✓"          },
            { feature:"Reports",                 starter:"—",         pro:"Basic",       business:"Advanced"   },
            { feature:"Marketing Emails",        starter:"—",         pro:"—",           business:"✓"          },
            { feature:"QuickBooks Integration",  starter:"—",         pro:"—",           business:"✓"          },
            { feature:"Email Support",           starter:"72hrs",     pro:"24hrs",       business:"12hrs"      },
          ].map((row, i) => (
            <div key={row.feature} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, padding:"12px 24px", borderBottom:i<11?`1px solid ${C.border}`:"none", background:i%2===0?"transparent":C.black }}>
              <span style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted }}>{row.feature}</span>
              {[row.starter, row.pro, row.business].map((val, j) => (
                <span key={j} style={{ fontFamily:FONT_BODY, fontSize:12, fontWeight:600, color:val==="—"?C.border:val==="✓"?C.emerald:C.white, textAlign:"center" }}>{val}</span>
              ))}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop:32 }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:18, fontWeight:700, color:C.white, marginBottom:16, textAlign:"center" }}>Frequently asked questions</div>
          {[
            { q:"Can I cancel anytime?", a:"Yes — cancel anytime from Settings. You keep access until the end of your billing period." },
            { q:"Do you offer a free trial?", a:"Yes! Every new account gets 14 days free with full access. No credit card required." },
            { q:"Can I switch plans?", a:"Absolutely. Upgrade or downgrade anytime from Settings → Subscription." },
            { q:"Is my data secure?", a:"Yes. All data is encrypted and stored securely. Payments are processed by Stripe." },
          ].map((item, i) => (
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:10 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.white, marginBottom:6 }}>{item.q}</div>
              <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.muted, lineHeight:1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:28, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <DiamondLogo size={14} />
          <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.dim }}>SwiftBook · getswiftbook.app</span>
        </div>
      </div>
    </div>
  );
}
