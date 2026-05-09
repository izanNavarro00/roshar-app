import { useState, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const SKILLS = ['destreza','inteligencia','fuerza','constitucion','suerte','carisma'];
const SKILL_ABR  = { destreza:'DES', inteligencia:'INT', fuerza:'FUE', constitucion:'CON', suerte:'STE', carisma:'CAR' };
const SKILL_NAME = { destreza:'Destreza', inteligencia:'Inteligencia', fuerza:'Fuerza', constitucion:'Constitución', suerte:'Suerte', carisma:'Carisma' };

const PARTS     = ['head','leftArm','torso','rightArm','leftLeg','rightLeg'];
const PART_NAME = { head:'Cabeza', leftArm:'Br.Izq', torso:'Torso', rightArm:'Br.Der', leftLeg:'P.Izq', rightLeg:'P.Der' };

const STATE_INFO = {
  healthy:   { bg:'#0a2e18', border:'#27ae60', glow:'#27ae6033', icon:'♥' },
  wounded:   { bg:'#2e0a0a', border:'#e74c3c', glow:'#e74c3c33', icon:'✸' },
  eliminated:{ bg:'#0e0e1a', border:'#3a3a5a', glow:'#00000000', icon:'✕' },
  armored:   { bg:'#0a1e32', border:'#2980b9', glow:'#2980b933', icon:'⬡' },
};

const MAX_CHARS = 16;

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  bg:'#080810', surface:'#10101e', card:'#16162a', border:'#28284a',
  gold:'#c8962e', goldDim:'#7a5a18',
  text:'#e8d5b0', textDim:'#7a6a4a', textMid:'#aa9a7a',
};

// ── Storage ────────────────────────────────────────────────────────────────────

const loadStorage = async () => {
  try {
    const c = await window.storage.get('rpg3_chars');
    const a = await window.storage.get('rpg3_active');
    return {
      chars:  c ? JSON.parse(c.value) : [],
      active: a ? (parseInt(a.value) || 0) : 0,
    };
  } catch {
    return { chars: [], active: 0 };
  }
};

const saveStorage = async (chars, active) => {
  try {
    await window.storage.set('rpg3_chars', JSON.stringify(chars));
    await window.storage.set('rpg3_active', String(active));
  } catch {}
};

// ── Factories ──────────────────────────────────────────────────────────────────

const mkPart   = () => ({ state:'healthy', armorMax:3, armorCurrent:3, shielded:false });
const mkParts  = () => Object.fromEntries(PARTS.map(p => [p, mkPart()]));
const mkSkills = (mx) => Object.fromEntries(SKILLS.map(s => [s, { max: mx[s] ?? 10, current: mx[s] ?? 10 }]));
const mkChar   = (name, mx) => ({ name: name || 'Héroe', bodyParts: mkParts(), skills: mkSkills(mx), items: [] });
const mkItem   = () => ({ id: Date.now() + Math.random(), name:'', description:'', usesMax:3, usesCurrent:3 });
const clone    = o => JSON.parse(JSON.stringify(o));

// ── Global CSS ─────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; user-select:none; }
  html,body { background:#080810; color:#e8d5b0; font-family:'Crimson Text',Georgia,serif; overflow:hidden; height:100%; }
  #root { height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden; }
  button { font-family:'Crimson Text',Georgia,serif; cursor:pointer; border:none; outline:none; transition:all 0.15s; }
  input,textarea { font-family:'Crimson Text',Georgia,serif; outline:none; }
  textarea { resize:vertical; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:#10101e; }
  ::-webkit-scrollbar-thumb { background:#28284a; border-radius:2px; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{transform:translateY(100%)}           to{transform:translateY(0)} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 10px #c8962e22}     50%{box-shadow:0 0 22px #c8962e55} }
`;

// ── Shared UI ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ width:160, height:1, background:`linear-gradient(90deg,transparent,${C.goldDim},transparent)`, margin:'10px auto 0' }} />;
}

function Label({ children }) {
  return <div style={{ color:C.textDim, fontSize:'0.72rem', letterSpacing:'3px', marginBottom:6, fontFamily:"'Cinzel',serif" }}>{children}</div>;
}

function SmallBtn({ children, onClick, red }) {
  return (
    <button onClick={onClick} style={{
      width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink:0, background:C.card, border:`1px solid ${C.border}`,
      color: red ? '#e74c3c' : C.gold, fontSize:'1.1rem', borderRadius:4,
    }}>{children}</button>
  );
}

function TopBar({ title, onBack }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:12, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      {onBack && (
        <button onClick={onBack} style={{ background:'none', color:C.textDim, fontSize:'1.1rem', padding:'4px 10px', border:`1px solid ${C.border}`, borderRadius:4 }}>←</button>
      )}
      <div style={{ flex:1, color:C.gold, fontSize:'0.95rem', letterSpacing:'3px', fontFamily:"'Cinzel',serif", fontWeight:600 }}>{title}</div>
    </div>
  );
}

function NavBtn({ children, onClick, purple }) {
  return (
    <button onClick={onClick} style={{
      background:'none', fontSize:'0.78rem', padding:'5px 9px', letterSpacing:'1px',
      flexShrink:0, whiteSpace:'nowrap', borderRadius:4,
      border:  `1px solid ${purple ? '#7c3aed' : C.border}`,
      color:    purple ? '#a855f7' : C.textDim,
      boxShadow: purple ? '0 0 10px #7c3aed44' : 'none',
    }}>{children}</button>
  );
}

function GoldBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:'100%', padding:'14px', borderRadius:6, fontSize:'1rem',
      letterSpacing:'2px', fontFamily:"'Cinzel',serif", fontWeight:600,
      background: disabled ? C.surface : 'linear-gradient(135deg,#2a2010,#1e1a0e)',
      border: `1px solid ${disabled ? C.border : C.goldDim}`,
      color:  disabled ? C.textDim : C.gold,
      boxShadow: disabled ? 'none' : `0 0 18px ${C.gold}22`,
    }}>{children}</button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [view,      setView]      = useState('loading');
  const [chars,     setChars]     = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [partEdit,  setPartEdit]  = useState(null);
  const [formData,  setFormData]  = useState(null);

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    loadStorage().then(({ chars: c, active: a }) => {
      setChars(c);
      setActiveIdx(Math.min(a, Math.max(0, c.length - 1)));
      setView(c.length > 0 ? 'play' : 'menu');
    });
  }, []);

  const persist   = (nc, ni = activeIdx) => { setChars(nc); setActiveIdx(ni); saveStorage(nc, ni); };
  const patchChar = (updated) => { const nc = clone(chars); nc[activeIdx] = updated; persist(nc); };
  const char      = chars[activeIdx];

  // Part helpers
  const setPartState = (part, state) => {
    const c = clone(char);
    c.bodyParts[part].state = state;
    if (state === 'armored') c.bodyParts[part].armorCurrent = c.bodyParts[part].armorMax;
    patchChar(c);
  };
  const toggleShield = (part) => {
    const c = clone(char);
    c.bodyParts[part].shielded = !c.bodyParts[part].shielded;
    patchChar(c);
  };
  const setArmorMax = (part, val) => {
    const c = clone(char);
    c.bodyParts[part].armorMax = val;
    c.bodyParts[part].armorCurrent = Math.min(c.bodyParts[part].armorCurrent, val);
    patchChar(c);
  };
  const changeArmor = (part, d) => {
    const c = clone(char);
    const bp = c.bodyParts[part];
    bp.armorCurrent = Math.max(0, Math.min(bp.armorMax, bp.armorCurrent + d));
    patchChar(c);
  };

  // Skill helpers
  const changeSkill = (skill, d) => {
    const c = clone(char);
    const s = c.skills[skill];
    s.current = Math.max(0, Math.min(s.max, s.current + d));
    patchChar(c);
  };

  // Item helpers
  const saveItem = (item) => {
    const c = clone(char);
    const idx = c.items.findIndex(i => i.id === item.id);
    if (idx >= 0) c.items[idx] = item; else c.items.push(item);
    patchChar(c);
  };
  const deleteItem = (id) => {
    const c = clone(char);
    c.items = c.items.filter(i => i.id !== id);
    patchChar(c);
  };
  const changeUses = (id, d) => {
    const c = clone(char);
    const item = c.items.find(i => i.id === id);
    if (item) item.usesCurrent = Math.max(0, Math.min(item.usesMax, item.usesCurrent + d));
    patchChar(c);
  };

  // ── Routing ──────────────────────────────────────────────────────────────────

  if (view === 'loading') return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.gold, fontSize:'1.4rem', letterSpacing:'6px', fontFamily:"'Cinzel',serif" }}>
      ✦ CARGANDO ✦
    </div>
  );

  if (view === 'menu') return (
    <MainMenu
      hasChars={chars.length > 0}
      onNew={() => { setFormData({ name:'', maxes: Object.fromEntries(SKILLS.map(s => [s, 10])) }); setView('create'); }}
      onChoose={() => setView('choose')}
      onBack={() => { if (chars.length > 0) setView('play'); }}
    />
  );

  if (view === 'choose') return (
    <ChooseChar
      chars={chars} activeIdx={activeIdx}
      onSelect={i => { persist(chars, i); setView('play'); }}
      onDelete={i => {
        const nc = chars.filter((_, j) => j !== i);
        const ni = Math.min(activeIdx, Math.max(0, nc.length - 1));
        persist(nc, ni);
        if (nc.length === 0) setView('menu');
      }}
      onBack={() => setView('menu')}
    />
  );

  if (view === 'create' || view === 'modify') return (
    <CharForm
      data={formData} setData={setFormData}
      isNew={view === 'create'} charCount={chars.length}
      onSave={() => {
        if (view === 'create') {
          const nc = [...chars, mkChar(formData.name, formData.maxes)];
          persist(nc, nc.length - 1);
        } else {
          const c = clone(char);
          c.name = formData.name;
          SKILLS.forEach(s => {
            const nm = formData.maxes[s];
            const ratio = c.skills[s].max > 0 ? c.skills[s].current / c.skills[s].max : 1;
            c.skills[s] = { max: nm, current: Math.min(nm, Math.round(ratio * nm)) };
          });
          patchChar(c);
        }
        setView('play');
      }}
      onBack={() => setView(view === 'create' ? 'menu' : 'play')}
    />
  );

  if (view === 'backpack') return (
    <BackpackScreen
      char={char} onBack={() => setView('play')}
      onSave={saveItem} onDelete={deleteItem} onChangeUses={changeUses}
    />
  );

  if (!char) { setView('menu'); return null; }

  return (
    <PlayScreen
      char={char} partEdit={partEdit} setPartEdit={setPartEdit}
      onMenu={() => setView('menu')}
      onModify={() => { setFormData({ name: char.name, maxes: Object.fromEntries(SKILLS.map(s => [s, char.skills[s].max])) }); setView('modify'); }}
      onBackpack={() => setView('backpack')}
      setPartState={setPartState} toggleShield={toggleShield}
      setArmorMax={setArmorMax} changeArmor={changeArmor} changeSkill={changeSkill}
    />
  );
}

// ── Main Menu ──────────────────────────────────────────────────────────────────

function MainMenu({ hasChars, onNew, onChoose, onBack }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18, padding:32, animation:'fadeUp 0.5s ease', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 40%, #1e1a0e44 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <div style={{ fontSize:'0.7rem', letterSpacing:'8px', color:C.goldDim, marginBottom:10, fontFamily:"'Cinzel',serif" }}>⚔ CRÓNICAS DE ⚔</div>
        <div style={{ fontSize:'2.4rem', color:C.gold, fontFamily:"'Cinzel',serif", fontWeight:700, letterSpacing:'2px', textShadow:`0 0 40px ${C.gold}55, 0 2px 4px #000` }}>ROL TRACKER</div>
        <Divider />
        <div style={{ fontSize:'0.75rem', letterSpacing:'4px', color:C.textDim, marginTop:10 }}>SISTEMA DE COMBATE</div>
      </div>

      <button onClick={onNew} style={{ width:'100%', maxWidth:280, padding:'15px 24px', borderRadius:6, fontSize:'1.05rem', letterSpacing:'2px', fontFamily:"'Cinzel',serif", background:'linear-gradient(135deg,#1e1a0a,#2a2214)', border:`1px solid ${C.goldDim}`, color:C.gold, boxShadow:`0 0 20px ${C.gold}22`, animation:'glow 3s infinite' }}>⊕ Crear Personaje</button>
      <button onClick={onChoose} style={{ width:'100%', maxWidth:280, padding:'15px 24px', borderRadius:6, fontSize:'1.05rem', letterSpacing:'2px', fontFamily:"'Cinzel',serif", background:C.surface, border:`1px solid ${C.border}`, color:C.textMid }}>⊞ Elegir Personaje</button>
      {hasChars && <button onClick={onBack} style={{ width:'100%', maxWidth:280, padding:'15px 24px', borderRadius:6, fontSize:'1.05rem', letterSpacing:'2px', fontFamily:"'Cinzel',serif", background:'none', border:`1px solid ${C.border}`, color:C.textDim }}>↩ Continuar Partida</button>}

      <div style={{ position:'absolute', bottom:20, color:C.textDim, fontSize:'0.7rem', letterSpacing:'3px', fontFamily:"'Cinzel',serif" }}>MÁX. {MAX_CHARS} PERSONAJES</div>
    </div>
  );
}

// ── Choose Character ───────────────────────────────────────────────────────────

function ChooseChar({ chars, activeIdx, onSelect, onDelete, onBack }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'16px 16px 20px', gap:14, animation:'fadeUp 0.3s ease' }}>
      <TopBar title="Elegir Personaje" onBack={onBack} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
        {chars.length === 0
          ? <div style={{ textAlign:'center', color:C.textDim, marginTop:50 }}>No hay personajes creados.</div>
          : chars.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background: i === activeIdx ? 'linear-gradient(135deg,#1e1a0e,#2a2214)' : C.card, border:`1px solid ${i === activeIdx ? C.goldDim : C.border}`, borderRadius:8, padding:'12px 14px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color: i === activeIdx ? C.gold : C.text, fontSize:'1.1rem', fontFamily:"'Cinzel',serif", marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 8px' }}>
                  {SKILLS.map(s => <span key={s} style={{ fontSize:'0.7rem', color:C.textDim }}><span style={{ color:C.textMid }}>{SKILL_ABR[s]}</span> {c.skills[s].current}/{c.skills[s].max}</span>)}
                </div>
              </div>
              <button onClick={() => onDelete(i)} style={{ background:'none', color:'#e74c3c', fontSize:'1rem', padding:'6px 8px', border:'1px solid #e74c3c33', borderRadius:4, flexShrink:0 }}>✕</button>
              <button onClick={() => onSelect(i)} style={{ background:C.goldDim, color:'#0a0a10', fontSize:'0.8rem', padding:'8px 14px', borderRadius:4, fontFamily:"'Cinzel',serif", fontWeight:700, flexShrink:0 }}>JUGAR</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Character Form ─────────────────────────────────────────────────────────────

function CharForm({ data, setData, isNew, charCount, onSave, onBack }) {
  if (!data) return null;
  const tooMany = isNew && charCount >= MAX_CHARS;
  const valid   = data.name.trim().length > 0 && !tooMany;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'16px 16px 24px', gap:14, animation:'fadeUp 0.3s ease', overflowY:'auto' }}>
      <TopBar title={isNew ? 'Nuevo Personaje' : 'Modificar Personaje'} onBack={onBack} />

      {tooMany && <div style={{ background:'#2e0a0a', border:'1px solid #e74c3c44', borderRadius:6, padding:10, color:'#e74c3c', textAlign:'center' }}>Ya tienes {MAX_CHARS} personajes. Elimina uno desde "Elegir Personaje".</div>}

      <div>
        <Label>NOMBRE DEL PERSONAJE</Label>
        <input
          value={data.name}
          onChange={e => setData({ ...data, name: e.target.value })}
          placeholder="Ej: Thorin, Aria, Zephyr..."
          maxLength={20}
          style={{ width:'100%', background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:6, padding:'10px 14px', fontSize:'1rem' }}
        />
      </div>

      <Label>VALORES MÁXIMOS (1–63)</Label>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {SKILLS.map(s => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:110, color:C.text, fontSize:'0.95rem' }}>{SKILL_NAME[s]}</div>
            <SmallBtn onClick={() => setData({ ...data, maxes: { ...data.maxes, [s]: Math.max(1, data.maxes[s] - 1) } })}>−</SmallBtn>
            <div style={{ flex:1, position:'relative', height:6, background:C.border, borderRadius:3, overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, width:`${(data.maxes[s] / 63) * 100}%`, background:`linear-gradient(90deg,${C.goldDim},${C.gold})`, transition:'width 0.2s', borderRadius:3 }} />
            </div>
            <SmallBtn onClick={() => setData({ ...data, maxes: { ...data.maxes, [s]: Math.min(63, data.maxes[s] + 1) } })}>+</SmallBtn>
            <div style={{ width:28, textAlign:'center', color:C.gold, fontSize:'1.1rem', fontWeight:'bold' }}>{data.maxes[s]}</div>
          </div>
        ))}
      </div>

      <GoldBtn onClick={onSave} disabled={!valid}>{isNew ? '⊕ CREAR PERSONAJE' : '✓ GUARDAR CAMBIOS'}</GoldBtn>
    </div>
  );
}

// ── Play Screen ────────────────────────────────────────────────────────────────

function PlayScreen({ char, partEdit, setPartEdit, onMenu, onModify, onBackpack, setPartState, toggleShield, setArmorMax, changeArmor, changeSkill }) {
  const itemCount = (char.items || []).length;
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Nav bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 8px', flexShrink:0, background:`linear-gradient(135deg,${C.surface},${C.card})`, borderBottom:`1px solid ${C.border}` }}>
        <NavBtn onClick={onMenu}>☰ Menú</NavBtn>
        <div style={{ flex:1, textAlign:'center', color:C.gold, fontSize:'0.95rem', fontFamily:"'Cinzel',serif", fontWeight:700, letterSpacing:'2px', textShadow:`0 0 14px ${C.gold}55`, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 4px' }}>{char.name}</div>
        <NavBtn onClick={onBackpack} purple>{'🎒' + (itemCount > 0 ? ' ' + itemCount : '')}</NavBtn>
        <NavBtn onClick={onModify}>✎</NavBtn>
      </div>

      {/* Body parts */}
      <div style={{ flex:'0 0 63%', padding:'8px 10px 6px', overflow:'hidden' }}>
        <BodyGrid bp={char.bodyParts} onPartClick={p => setPartEdit(p)} onToggleShield={toggleShield} />
      </div>

      {/* Skills */}
      <div style={{ flex:1, borderTop:`1px solid ${C.border}`, padding:'6px 8px 8px', overflow:'hidden', minHeight:0 }}>
        <SkillBars skills={char.skills} onChange={changeSkill} />
      </div>

      {/* Part modal */}
      {partEdit && (
        <PartModal
          part={partEdit} bp={char.bodyParts[partEdit]}
          onClose={() => setPartEdit(null)}
          onSetState={s => setPartState(partEdit, s)}
          onSetArmorMax={v => setArmorMax(partEdit, v)}
          onChangeArmor={d => changeArmor(partEdit, d)}
        />
      )}
    </div>
  );
}

// ── Body Grid ──────────────────────────────────────────────────────────────────

function BodyGrid({ bp, onPartClick, onToggleShield }) {
  const parts = [
    { key:'head',     label:'Cabeza', style:{ gridColumn:'2/4', gridRow:1 } },
    { key:'leftArm',  label:'Br.Izq', style:{ gridColumn:1,     gridRow:2 } },
    { key:'torso',    label:'Torso',  style:{ gridColumn:'2/4', gridRow:2 } },
    { key:'rightArm', label:'Br.Der', style:{ gridColumn:4,     gridRow:2 } },
    { key:'leftLeg',  label:'P.Izq',  style:{ gridColumn:'1/3', gridRow:3 } },
    { key:'rightLeg', label:'P.Der',  style:{ gridColumn:'3/5', gridRow:3 } },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gridTemplateRows:'1fr 1fr 1fr', gap:6, height:'100%' }}>
      {parts.map(({ key, label, style }) => (
        <BodyPart
          key={key} bp={bp[key]} label={label} gridStyle={style}
          onClick={() => onPartClick(key)}
          onToggle={() => onToggleShield(key)}
        />
      ))}
    </div>
  );
}

function BodyPart({ bp, label, gridStyle, onClick, onToggle }) {
  const info      = STATE_INFO[bp.state];
  const isShield  = bp.shielded;

  return (
    <div
      onClick={onClick}
      style={{
        ...gridStyle,
        background: info.bg, border:`2px solid ${info.border}`, borderRadius:10,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
        boxShadow:`0 0 14px ${info.glow}, inset 0 0 10px ${info.glow}`,
        cursor:'pointer', padding:4, position:'relative', overflow:'hidden',
      }}
    >
      {bp.state === 'eliminated' && (
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(-45deg,transparent,transparent 5px,#ffffff08 5px,#ffffff08 6px)', pointerEvents:'none' }} />
      )}

      {/* Shield toggle — top right */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          position:'absolute', top:3, right:3, zIndex:10,
          width:18, height:18, borderRadius:3, padding:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.6rem', lineHeight:1, border:'none',
          background: isShield ? '#7c3aed' : '#ffffff12',
          color:      isShield ? '#fff'    : '#ffffff30',
          boxShadow:  isShield ? '0 0 8px #7c3aed88' : 'none',
          transition: 'all 0.2s',
        }}
      >🛡</button>

      <div style={{ fontSize:'0.58rem', letterSpacing:'2px', color:info.border, opacity:0.85, fontFamily:"'Cinzel',serif", zIndex:1, marginTop:6 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:'1.5rem', color:info.border, textShadow:`0 0 10px ${info.border}88`, zIndex:1, lineHeight:1 }}>{info.icon}</div>
      {bp.state === 'armored'   && <div style={{ fontSize:'0.68rem', color:'#5aade8', letterSpacing:'1px', fontWeight:'bold', zIndex:1 }}>{bp.armorCurrent}/{bp.armorMax}</div>}
      {bp.state === 'wounded'   && <div style={{ fontSize:'0.58rem', color:'#e74c3c', letterSpacing:'1px', zIndex:1 }}>HERIDA</div>}
    </div>
  );
}

// ── Part Modal ─────────────────────────────────────────────────────────────────

function PartModal({ part, bp, onClose, onSetState, onSetArmorMax, onChangeArmor }) {
  const states = [
    { key:'healthy',    label:'♥ Sano',     desc:'Sin daño' },
    { key:'wounded',    label:'✸ Herida',    desc:'1 herida' },
    { key:'eliminated', label:'✕ Eliminado', desc:'2 heridas' },
    { key:'armored',    label:'⬡ Armadura',  desc:'Con protección' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'#000000aa', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200, backdropFilter:'blur(5px)' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:500, background:C.surface, border:`1px solid ${C.border}`, borderRadius:'18px 18px 0 0', padding:'20px 18px 32px', animation:'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:36, height:3, background:C.border, borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ textAlign:'center', color:C.gold, fontSize:'1rem', fontFamily:"'Cinzel',serif", letterSpacing:'3px', marginBottom:18 }}>{PART_NAME[part].toUpperCase()}</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {states.map(({ key, label, desc }) => {
            const info   = STATE_INFO[key];
            const active = bp.state === key;
            return (
              <button key={key} onClick={() => onSetState(key)} style={{ padding:'12px 8px', borderRadius:8, display:'flex', flexDirection:'column', alignItems:'center', gap:2, background: active ? info.bg : C.card, border:`2px solid ${active ? info.border : C.border}`, color: active ? info.border : C.textDim, boxShadow: active ? `0 0 14px ${info.glow}` : 'none' }}>
                <span style={{ fontSize:'1rem' }}>{label}</span>
                <span style={{ fontSize:'0.7rem', opacity:0.7 }}>{desc}</span>
              </button>
            );
          })}
        </div>

        {bp.state === 'armored' && (
          <div style={{ background:C.card, border:'1px solid #2980b933', borderRadius:10, padding:14, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ color:'#5aade8', fontSize:'0.75rem', letterSpacing:'3px', textAlign:'center', fontFamily:"'Cinzel',serif" }}>⬡ ARMADURA</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ color:C.textDim, fontSize:'0.85rem', width:90, flexShrink:0 }}>Máx. golpes</div>
              <SmallBtn onClick={() => onSetArmorMax(Math.max(1, bp.armorMax - 1))}>−</SmallBtn>
              <div style={{ flex:1, textAlign:'center', color:'#5aade8', fontSize:'1.4rem', fontWeight:'bold' }}>{bp.armorMax}</div>
              <SmallBtn onClick={() => onSetArmorMax(Math.min(10, bp.armorMax + 1))}>+</SmallBtn>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ color:C.textDim, fontSize:'0.85rem', width:90, flexShrink:0 }}>Restantes</div>
              <SmallBtn onClick={() => onChangeArmor(-1)} red>−</SmallBtn>
              <div style={{ flex:1, textAlign:'center', color: bp.armorCurrent === 0 ? '#e74c3c' : '#5aade8', fontSize:'1.4rem', fontWeight:'bold' }}>{bp.armorCurrent}</div>
              <SmallBtn onClick={() => onChangeArmor(+1)}>+</SmallBtn>
            </div>
            <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
              {Array.from({ length: bp.armorMax }, (_, i) => (
                <div key={i} style={{ width:22, height:22, borderRadius:4, transition:'all 0.2s', background: i < bp.armorCurrent ? '#2980b9' : C.surface, border:`1px solid ${i < bp.armorCurrent ? '#5aade8' : C.border}`, boxShadow: i < bp.armorCurrent ? '0 0 6px #2980b966' : 'none' }} />
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ width:'100%', marginTop:14, padding:'12px', background:'none', border:`1px solid ${C.border}`, color:C.textDim, borderRadius:6, fontSize:'0.9rem', letterSpacing:'2px', fontFamily:"'Cinzel',serif" }}>CERRAR</button>
      </div>
    </div>
  );
}

// ── Skill Bars ─────────────────────────────────────────────────────────────────

function SkillBars({ skills, onChange }) {
  return (
    <div style={{ display:'flex', gap:5, height:'100%', alignItems:'stretch' }}>
      {SKILLS.map(s => {
        const { current, max } = skills[s];
        const pct      = max > 0 ? current / max : 0;
        const barColor = pct > 0.65 ? C.gold : pct > 0.35 ? '#e67e22' : '#e74c3c';
        return (
          <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:0 }}>
            <button onClick={() => onChange(s, +1)} style={{ width:'100%', padding:'3px 1px', flexShrink:0, background:C.card, border:`1px solid ${C.border}`, color:C.gold, fontSize:'1rem', borderRadius:3, lineHeight:1.2 }}>+</button>
            <div style={{ flex:1, width:'100%', position:'relative', minHeight:0 }}>
              <div style={{ position:'absolute', inset:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:4 }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${pct * 100}%`, background:`linear-gradient(to top,${barColor},${barColor}99)`, borderRadius:4, transition:'height 0.3s ease', boxShadow:`0 0 8px ${barColor}55` }} />
              <div style={{ position:'absolute', bottom:3, width:'100%', textAlign:'center', color:'#fff', fontSize:'0.82rem', fontWeight:'bold', textShadow:'0 1px 3px #000', zIndex:1 }}>{current}</div>
              <div style={{ position:'absolute', top:3, width:'100%', textAlign:'center', color:C.textDim, fontSize:'0.62rem', zIndex:1 }}>/{max}</div>
            </div>
            <button onClick={() => onChange(s, -1)} style={{ width:'100%', padding:'3px 1px', flexShrink:0, background:C.card, border:`1px solid ${C.border}`, color:'#e74c3c', fontSize:'1rem', borderRadius:3, lineHeight:1.2 }}>−</button>
            <div style={{ fontSize:'0.6rem', color:C.textDim, letterSpacing:'1px', textAlign:'center', fontFamily:"'Cinzel',serif", flexShrink:0 }}>{SKILL_ABR[s]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Backpack Screen ────────────────────────────────────────────────────────────

function BackpackScreen({ char, onBack, onSave, onDelete, onChangeUses }) {
  const [editing, setEditing] = useState(null);
  const items = char.items || [];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'16px 16px 20px', gap:14, animation:'fadeUp 0.3s ease', overflow:'hidden' }}>
      <TopBar title="🎒 Mochila" onBack={onBack} />

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        {items.length === 0 && !editing && (
          <div style={{ textAlign:'center', color:C.textDim, marginTop:40, fontStyle:'italic' }}>La mochila está vacía.<br />Añade tu primer objeto.</div>
        )}
        {items.map(item => (
          <ItemRow
            key={item.id} item={item}
            onEdit={() => setEditing(clone(item))}
            onDelete={() => onDelete(item.id)}
            onChangeUses={d => onChangeUses(item.id, d)}
          />
        ))}
      </div>

      {!editing && (
        <button
          onClick={() => setEditing(mkItem())}
          style={{ padding:'13px', borderRadius:8, fontSize:'1rem', fontFamily:"'Cinzel',serif", letterSpacing:'2px', background:'linear-gradient(135deg,#1e1a0e,#2a2214)', border:`1px solid ${C.goldDim}`, color:C.gold, boxShadow:`0 0 16px ${C.gold}22` }}
        >⊕ AÑADIR OBJETO</button>
      )}

      {editing && (
        <ItemModal
          item={editing}
          onChange={setEditing}
          onSave={() => { if (!editing.name.trim()) return; onSave(editing); setEditing(null); }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ── Item Row ───────────────────────────────────────────────────────────────────

function ItemRow({ item, onEdit, onDelete, onChangeUses }) {
  const [expanded, setExpanded] = useState(false);
  const pct = item.usesMax > 0 ? item.usesCurrent / item.usesMax : 0;
  const col = pct > 0.6 ? '#27ae60' : pct > 0.3 ? '#e67e22' : '#e74c3c';

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', cursor:'pointer' }} onClick={() => setExpanded(v => !v)}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:C.text, fontSize:'1rem', fontFamily:"'Cinzel',serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name || 'Sin nombre'}</div>
          {!expanded && item.description && (
            <div style={{ color:C.textDim, fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontStyle:'italic', marginTop:2 }}>{item.description}</div>
          )}
        </div>

        {/* Quick uses controls */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onChangeUses(-1)} style={{ width:30, height:30, background:C.surface, border:'1px solid #e74c3c44', color:'#e74c3c', borderRadius:4, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
          <div style={{ minWidth:38, textAlign:'center' }}>
            <div style={{ color:col, fontSize:'1rem', fontWeight:'bold', lineHeight:1 }}>{item.usesCurrent}</div>
            <div style={{ color:C.textDim, fontSize:'0.62rem' }}>/{item.usesMax}</div>
          </div>
          <button onClick={() => onChangeUses(+1)} style={{ width:30, height:30, background:C.surface, border:`1px solid ${C.goldDim}55`, color:C.gold, borderRadius:4, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        </div>

        <div style={{ color:C.textDim, fontSize:'0.75rem', marginLeft:4 }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {/* Uses bar */}
      <div style={{ height:3, background:C.surface }}>
        <div style={{ height:'100%', width:`${pct * 100}%`, background:col, transition:'width 0.3s' }} />
      </div>

      {expanded && (
        <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:10 }}>
          {item.description && <div style={{ color:C.textMid, fontSize:'0.9rem', fontStyle:'italic', lineHeight:1.5 }}>{item.description}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onEdit}   style={{ flex:1, padding:'8px', background:C.surface, border:`1px solid ${C.border}`, color:C.textMid, borderRadius:6, fontSize:'0.85rem', fontFamily:"'Cinzel',serif" }}>✎ Editar</button>
            <button onClick={onDelete} style={{ padding:'8px 14px', background:'none', border:'1px solid #e74c3c44', color:'#e74c3c', borderRadius:6, fontSize:'0.85rem' }}>✕ Borrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Item Modal ─────────────────────────────────────────────────────────────────

function ItemModal({ item, onChange, onSave, onCancel }) {
  const valid = item.name.trim().length > 0;
  const set   = (k, v) => onChange({ ...item, [k]: v });

  return (
    <div style={{ position:'fixed', inset:0, background:'#000000bb', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300, backdropFilter:'blur(6px)' }} onClick={onCancel}>
      <div style={{ width:'100%', maxWidth:520, background:C.surface, border:`1px solid ${C.border}`, borderRadius:'18px 18px 0 0', padding:'20px 16px 32px', animation:'slideUp 0.25s ease', display:'flex', flexDirection:'column', gap:14, maxHeight:'85vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:36, height:3, background:C.border, borderRadius:2, margin:'0 auto' }} />
        <div style={{ color:C.gold, fontSize:'0.9rem', fontFamily:"'Cinzel',serif", letterSpacing:'3px', textAlign:'center' }}>{item.name ? item.name.toUpperCase() : 'NUEVO OBJETO'}</div>

        {/* Name */}
        <div>
          <Label>NOMBRE</Label>
          <input value={item.name} onChange={e => set('name', e.target.value)} placeholder="Poción de vida, Espada mágica..." maxLength={40}
            style={{ width:'100%', background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:6, padding:'10px 12px', fontSize:'1rem' }} />
        </div>

        {/* Description */}
        <div>
          <Label>DESCRIPCIÓN</Label>
          <textarea value={item.description} onChange={e => set('description', e.target.value)} placeholder="Efectos, notas, historia del objeto..." rows={3}
            style={{ width:'100%', background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:6, padding:'10px 12px', fontSize:'0.95rem', lineHeight:1.5, minHeight:70 }} />
        </div>

        {/* Uses */}
        <div>
          <Label>USOS</Label>
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ color:C.textDim, fontSize:'0.75rem', marginBottom:8 }}>Máximos</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <SmallBtn onClick={() => set('usesMax', Math.max(1, item.usesMax - 1))}>−</SmallBtn>
                <div style={{ flex:1, textAlign:'center', color:C.gold, fontSize:'1.4rem', fontWeight:'bold' }}>{item.usesMax}</div>
                <SmallBtn onClick={() => set('usesMax', Math.min(99, item.usesMax + 1))}>+</SmallBtn>
              </div>
            </div>
            <div style={{ width:1, background:C.border }} />
            <div style={{ flex:1 }}>
              <div style={{ color:C.textDim, fontSize:'0.75rem', marginBottom:8 }}>Restantes</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <SmallBtn onClick={() => set('usesCurrent', Math.max(0, item.usesCurrent - 1))} red>−</SmallBtn>
                <div style={{ flex:1, textAlign:'center', color: item.usesCurrent === 0 ? '#e74c3c' : C.gold, fontSize:'1.4rem', fontWeight:'bold' }}>{item.usesCurrent}</div>
                <SmallBtn onClick={() => set('usesCurrent', Math.min(item.usesMax, item.usesCurrent + 1))}>+</SmallBtn>
              </div>
            </div>
          </div>

          {/* Pips */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:12 }}>
            {Array.from({ length: Math.min(item.usesMax, 20) }, (_, i) => (
              <div key={i}
                onClick={() => set('usesCurrent', i < item.usesCurrent ? i : i + 1)}
                style={{ width:24, height:24, borderRadius:4, cursor:'pointer', transition:'all 0.15s', background: i < item.usesCurrent ? C.gold : C.surface, border:`1px solid ${i < item.usesCurrent ? C.goldDim : C.border}`, boxShadow: i < item.usesCurrent ? `0 0 6px ${C.gold}44` : 'none' }}
              />
            ))}
            {item.usesMax > 20 && <div style={{ color:C.textDim, fontSize:'0.75rem', alignSelf:'center' }}>+{item.usesMax - 20} más</div>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', background:'none', border:`1px solid ${C.border}`, color:C.textDim, borderRadius:6, fontSize:'0.9rem', letterSpacing:'2px', fontFamily:"'Cinzel',serif" }}>CANCELAR</button>
          <GoldBtn onClick={onSave} disabled={!valid}>✓ GUARDAR</GoldBtn>
        </div>
      </div>
    </div>
  );
}
