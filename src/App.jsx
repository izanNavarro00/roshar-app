import { useState, useEffect } from "react";

// ═══ CONSTANTS ════════════════════════════════════════════════════════════════

const SKILLS = ['destreza','inteligencia','fuerza','constitucion','suerte','carisma'];
const SKILL_ABR = { destreza:'DES', inteligencia:'INT', fuerza:'FUE', constitucion:'CON', suerte:'STE', carisma:'CAR' };
const SKILL_NAME = { destreza:'Destreza', inteligencia:'Inteligencia', fuerza:'Fuerza', constitucion:'Constitución', suerte:'Suerte', carisma:'Carisma' };

const PARTS = ['head','leftArm','torso','rightArm','leftLeg','rightLeg'];
const PART_NAME = { head:'Cabeza', leftArm:'Br.Izq', torso:'Torso', rightArm:'Br.Der', leftLeg:'P.Izq', rightLeg:'P.Der' };

const STATE_INFO = {
  healthy:   { bg:'#0a2e18', border:'#27ae60', glow:'#27ae6033', icon:'♥', label:'Sano' },
  wounded:   { bg:'#2e0a0a', border:'#e74c3c', glow:'#e74c3c33', icon:'✸', label:'Herida' },
  eliminated:{ bg:'#0e0e1a', border:'#3a3a5a', glow:'#00000000', icon:'✕', label:'Eliminado' },
  armored:   { bg:'#0a1e32', border:'#2980b9', glow:'#2980b933', icon:'⬡', label:'Armadura' },
};

// ═══ PALETTE ══════════════════════════════════════════════════════════════════

const C = {
  bg:'#080810', surface:'#10101e', card:'#16162a', border:'#28284a',
  gold:'#c8962e', goldDim:'#7a5a18', goldBg:'#1e1a0e',
  text:'#e8d5b0', textDim:'#7a6a4a', textMid:'#aa9a7a',
};


// ═══ STORAGE ══════════════════════════════════════════════════════════════════

const loadStorage = async () => {
  try {
    const c = localStorage.getItem('rpg2_chars');
    const a = localStorage.getItem('rpg2_active');
    return { chars: c ? JSON.parse(c) : [], active: a ? parseInt(a)||0 : 0 };
  } catch { return { chars:[], active:0 }; }
};
const saveStorage = async (chars, active) => {
  try {
    localStorage.setItem('rpg2_chars', JSON.stringify(chars));
    localStorage.setItem('rpg2_active', String(active));
  } catch {}
};
// ═══ DEFAULTS ═════════════════════════════════════════════════════════════════

const mkParts = () => Object.fromEntries(PARTS.map(p=>[p,{state:'healthy',armorMax:3,armorCurrent:3}]));
const mkSkills = (mx={}) => Object.fromEntries(SKILLS.map(s=>[s,{max:mx[s]??10,current:mx[s]??10}]));
const mkChar = (name,mx) => ({name:name||'Héroe',bodyParts:mkParts(),skills:mkSkills(mx)});
const clone = o => JSON.parse(JSON.stringify(o));

// ═══ GLOBAL STYLES ════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; user-select:none; }
  html, body { background:${C.bg}; color:${C.text}; font-family:'Crimson Text',Georgia,serif; overflow:hidden; height:100%; }
  #root { height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden; }
  button { font-family:'Crimson Text',Georgia,serif; cursor:pointer; border:none; outline:none; transition:all 0.15s; }
  input { font-family:'Crimson Text',Georgia,serif; outline:none; }
  ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:${C.surface}; } ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:2px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes shimmer { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 10px #c8962e22} 50%{box-shadow:0 0 22px #c8962e55} }
`;

// ═══ MAIN APP ════════════════════════════════════════════════════════════════

export default function App() {
  const [view, setView]         = useState('loading');
  const [chars, setChars]       = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [partEdit, setPartEdit] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    loadStorage().then(({ chars, active }) => {
      setChars(chars);
      setActiveIdx(Math.min(active, Math.max(0, chars.length-1)));
      setView(chars.length > 0 ? 'play' : 'menu');
    });
  }, []);

  const persist = (nc, ni=activeIdx) => { setChars(nc); setActiveIdx(ni); saveStorage(nc,ni); };
  const patchChar = (updated, idx=activeIdx) => { const nc=clone(chars); nc[idx]=updated; persist(nc); };

  const char = chars[activeIdx];

  // ── Patch helpers ──────────────────────────────────────────────────────────
  const setPartState = (part, state) => {
    const c = clone(char);
    c.bodyParts[part].state = state;
    if (state==='armored') c.bodyParts[part].armorCurrent = c.bodyParts[part].armorMax;
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
  const changeSkill = (skill, d) => {
    const c = clone(char);
    const s = c.skills[skill];
    s.current = Math.max(0, Math.min(s.max, s.current + d));
    patchChar(c);
  };

  // ── Routing ────────────────────────────────────────────────────────────────
  if (view==='loading') return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:C.gold,fontSize:'1.4rem',letterSpacing:'6px',fontFamily:"'Cinzel',serif"}}>✦ CARGANDO ✦</div>
  );

  if (view==='menu') return (
    <MainMenu
      hasChars={chars.length>0}
      onNew={() => { setFormData({name:'',maxes:Object.fromEntries(SKILLS.map(s=>[s,10]))}); setView('create'); }}
      onChoose={() => setView('choose')}
      onBack={() => chars.length>0 && setView('play')}
    />
  );

  if (view==='choose') return (
    <ChooseChar chars={chars} activeIdx={activeIdx}
      onSelect={i => { persist(chars,i); setView('play'); }}
      onDelete={i => {
        const nc = chars.filter((_,j)=>j!==i);
        const ni = Math.min(activeIdx, Math.max(0, nc.length-1));
        persist(nc, ni);
        if (nc.length===0) setView('menu');
      }}
      onBack={() => setView('menu')}
    />
  );

  if (view==='create'||view==='modify') return (
    <CharForm data={formData} setData={setFormData} isNew={view==='create'} charCount={chars.length}
      onSave={() => {
        if (view==='create') {
          const nc = [...chars, mkChar(formData.name, formData.maxes)];
          persist(nc, nc.length-1);
        } else {
          const c = clone(char);
          c.name = formData.name;
          SKILLS.forEach(s => {
            const nm = formData.maxes[s];
            const ratio = c.skills[s].max>0 ? c.skills[s].current/c.skills[s].max : 1;
            c.skills[s] = { max:nm, current:Math.min(nm,Math.round(ratio*nm)) };
          });
          patchChar(c);
        }
        setView('play');
      }}
      onBack={() => setView(view==='create' ? 'menu' : 'play')}
    />
  );

  if (!char) { setView('menu'); return null; }

  return (
    <PlayScreen char={char} partEdit={partEdit} setPartEdit={setPartEdit}
      onMenu={()=>setView('menu')} onModify={()=>{
        setFormData({name:char.name, maxes:Object.fromEntries(SKILLS.map(s=>[s,char.skills[s].max]))});
        setView('modify');
      }}
      setPartState={setPartState} setArmorMax={setArmorMax}
      changeArmor={changeArmor} changeSkill={changeSkill}
    />
  );
}

// ═══ MAIN MENU ════════════════════════════════════════════════════════════════

function MainMenu({ hasChars, onNew, onChoose, onBack }) {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,padding:32,animation:'fadeUp 0.5s ease',position:'relative',overflow:'hidden'}}>
      {/* Decorative background */}
      <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 40%, #1e1a0e44 0%, transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:'15%',left:'50%',transform:'translateX(-50%)',width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle, ${C.goldDim}11, transparent 70%)`,pointerEvents:'none'}}/>

      {/* Logo */}
      <div style={{textAlign:'center',marginBottom:8,position:'relative'}}>
        <div style={{fontSize:'0.7rem',letterSpacing:'8px',color:C.goldDim,marginBottom:10,fontFamily:"'Cinzel',serif"}}>⚔ CRÓNICAS DE ⚔</div>
        <div style={{fontSize:'2.4rem',color:C.gold,fontFamily:"'Cinzel',serif",fontWeight:700,letterSpacing:'2px',textShadow:`0 0 40px ${C.gold}55, 0 2px 4px #000`}}>
          ROL TRACKER
        </div>
        <Divider />
        <div style={{fontSize:'0.75rem',letterSpacing:'4px',color:C.textDim,marginTop:10}}>SISTEMA DE COMBATE</div>
      </div>

      <BigBtn onClick={onNew}>⊕ Crear Personaje</BigBtn>
      <BigBtn onClick={onChoose} secondary>⊞ Elegir Personaje</BigBtn>
      {hasChars && <BigBtn onClick={onBack} ghost>↩ Continuar Partida</BigBtn>}

      <div style={{position:'absolute',bottom:20,color:C.textDim,fontSize:'0.7rem',letterSpacing:'3px',fontFamily:"'Cinzel',serif"}}>
        MÁX. 3 PERSONAJES
      </div>
    </div>
  );
}

function BigBtn({ children, onClick, secondary, ghost }) {
  const base = {
    width:'100%',maxWidth:280,padding:'15px 24px',borderRadius:6,fontSize:'1.05rem',
    letterSpacing:'2px',fontFamily:"'Cinzel',serif",fontWeight:400,
  };
  if (ghost) return <button onClick={onClick} style={{...base, background:'none', border:`1px solid ${C.border}`, color:C.textDim}}>{children}</button>;
  if (secondary) return <button onClick={onClick} style={{...base, background:C.surface, border:`1px solid ${C.border}`, color:C.textMid}}>{children}</button>;
  return (
    <button onClick={onClick} style={{...base, background:`linear-gradient(135deg,#1e1a0a,#2a2214)`, border:`1px solid ${C.goldDim}`, color:C.gold, boxShadow:`0 0 20px ${C.gold}22`, animation:'glowPulse 3s infinite'}}>
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{width:160,height:1,background:`linear-gradient(90deg,transparent,${C.goldDim},transparent)`,margin:'10px auto 0'}}/>;
}

// ═══ CHOOSE CHARACTER ═════════════════════════════════════════════════════════

function ChooseChar({ chars, activeIdx, onSelect, onDelete, onBack }) {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:'16px 16px 20px',gap:14,animation:'fadeUp 0.3s ease'}}>
      <TopBar title="Elegir Personaje" onBack={onBack} />
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:10,overflowY:'auto'}}>
        {chars.length===0
          ? <div style={{textAlign:'center',color:C.textDim,marginTop:50,fontSize:'1rem'}}>No hay personajes creados.<br/>Crea uno nuevo desde el menú.</div>
          : chars.map((c,i) => (
            <CharCard key={i} c={c} active={i===activeIdx}
              onSelect={()=>onSelect(i)} onDelete={()=>onDelete(i)} />
          ))
        }
      </div>
    </div>
  );
}

function CharCard({ c, active, onSelect, onDelete }) {
  return (
    <div style={{
      display:'flex',alignItems:'center',gap:10,
      background: active ? `linear-gradient(135deg,#1e1a0e,#2a2214)` : C.card,
      border:`1px solid ${active ? C.goldDim : C.border}`,
      borderRadius:8,padding:'12px 14px',
      boxShadow: active ? `0 0 16px ${C.gold}22` : 'none',
    }}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:active?C.gold:C.text,fontSize:'1.1rem',fontFamily:"'Cinzel',serif",marginBottom:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px 8px'}}>
          {SKILLS.map(s=>(
            <span key={s} style={{fontSize:'0.7rem',color:C.textDim}}>
              <span style={{color:C.textMid}}>{SKILL_ABR[s]}</span> {c.skills[s].current}/{c.skills[s].max}
            </span>
          ))}
        </div>
      </div>
      <button onClick={onDelete} style={{background:'none',color:'#e74c3c',fontSize:'1rem',padding:'6px 8px',border:'1px solid #e74c3c33',borderRadius:4,flexShrink:0}}>✕</button>
      <button onClick={onSelect} style={{background:C.goldDim,color:'#0a0a10',fontSize:'0.8rem',padding:'8px 14px',borderRadius:4,fontFamily:"'Cinzel',serif",letterSpacing:'1px',fontWeight:700,flexShrink:0}}>
        JUGAR
      </button>
    </div>
  );
}

// ═══ CHARACTER FORM (create / modify) ════════════════════════════════════════

function CharForm({ data, setData, isNew, charCount, onSave, onBack }) {
  if (!data) return null;
  const tooMany = isNew && charCount>=3;
  const valid = data.name.trim().length>0 && !tooMany;

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:'16px 16px 24px',gap:14,animation:'fadeUp 0.3s ease',overflowY:'auto'}}>
      <TopBar title={isNew?'Nuevo Personaje':'Modificar Personaje'} onBack={onBack} />

      {tooMany && (
        <div style={{background:'#2e0a0a',border:'1px solid #e74c3c44',borderRadius:6,padding:10,color:'#e74c3c',fontSize:'0.9rem',textAlign:'center'}}>
          Ya tienes 3 personajes. Elimina uno desde "Elegir Personaje".
        </div>
      )}

      {/* Name */}
      <div>
        <Label>NOMBRE DEL PERSONAJE</Label>
        <input value={data.name} onChange={e=>setData({...data,name:e.target.value})} placeholder="Ej: Thorin, Aria, Zephyr..." maxLength={20}
          style={{width:'100%',background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:'10px 14px',fontSize:'1rem'}} />
      </div>

      {/* Skill maxes */}
      <Label>VALORES MÁXIMOS (1-63)</Label>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {SKILLS.map(s => (
          <div key={s} style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:110,color:C.text,fontSize:'0.95rem'}}>{SKILL_NAME[s]}</div>
            <SmallBtn onClick={()=>setData({...data,maxes:{...data.maxes,[s]:Math.max(1,data.maxes[s]-1)}})}>−</SmallBtn>
            <div style={{flex:1,position:'relative',height:6,background:C.border,borderRadius:3,overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,width:`${(data.maxes[s]/63)*100}%`,background:`linear-gradient(90deg,${C.goldDim},${C.gold})`,transition:'width 0.2s',borderRadius:3}}/>
            </div>
            <SmallBtn onClick={()=>setData({...data,maxes:{...data.maxes,[s]:Math.min(63,data.maxes[s]+1)}})}>+</SmallBtn>
            <div style={{width:22,textAlign:'center',color:C.gold,fontSize:'1.1rem',fontWeight:'bold'}}>{data.maxes[s]}</div>
          </div>
        ))}
      </div>

      <button onClick={onSave} disabled={!valid} style={{
        marginTop:4,padding:'14px',borderRadius:6,fontSize:'1rem',letterSpacing:'2px',
        fontFamily:"'Cinzel',serif",fontWeight:600,
        background: valid ? `linear-gradient(135deg,#2a2010,#1e1a0e)` : C.surface,
        border:`1px solid ${valid ? C.goldDim : C.border}`,
        color: valid ? C.gold : C.textDim,
        boxShadow: valid ? `0 0 18px ${C.gold}22` : 'none',
      }}>
        {isNew ? '⊕ CREAR PERSONAJE' : '✓ GUARDAR CAMBIOS'}
      </button>
    </div>
  );
}

function Label({ children }) {
  return <div style={{color:C.textDim,fontSize:'0.72rem',letterSpacing:'3px',marginBottom:6,fontFamily:"'Cinzel',serif"}}>{children}</div>;
}
function SmallBtn({ children, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
      background:C.card,border:`1px solid ${C.border}`,color:color||C.gold,fontSize:'1.1rem',borderRadius:4,
    }}>{children}</button>
  );
}

// ═══ TOP BAR ═════════════════════════════════════════════════════════════════

function TopBar({ title, onBack, rightLabel, onRight }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:12,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
      {onBack && (
        <button onClick={onBack} style={{background:'none',color:C.textDim,fontSize:'1.1rem',padding:'4px 10px',border:`1px solid ${C.border}`,borderRadius:4,flexShrink:0}}>←</button>
      )}
      <div style={{flex:1,color:C.gold,fontSize:'0.95rem',letterSpacing:'3px',fontFamily:"'Cinzel',serif",fontWeight:600}}>{title}</div>
      {onRight && (
        <button onClick={onRight} style={{background:'none',color:C.textDim,fontSize:'0.8rem',padding:'4px 10px',border:`1px solid ${C.border}`,borderRadius:4,flexShrink:0,letterSpacing:'1px'}}>{rightLabel}</button>
      )}
    </div>
  );
}

// ═══ PLAY SCREEN ══════════════════════════════════════════════════════════════

function PlayScreen({ char, partEdit, setPartEdit, onMenu, onModify, setPartState, setArmorMax, changeArmor, changeSkill }) {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* ── Nav bar ── */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'7px 12px',flexShrink:0,
        background:`linear-gradient(135deg,${C.surface},${C.card})`,
        borderBottom:`1px solid ${C.border}`,
      }}>
        <PlayNavBtn onClick={onMenu}>☰ Menú</PlayNavBtn>
        <div style={{color:C.gold,fontSize:'1rem',fontFamily:"'Cinzel',serif",fontWeight:700,letterSpacing:'3px',textShadow:`0 0 14px ${C.gold}55`,textAlign:'center',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 8px'}}>
          {char.name}
        </div>
        <PlayNavBtn onClick={onModify}>✎ Modificar</PlayNavBtn>
      </div>

      {/* ── Body parts (63%) ── */}
      <div style={{flex:'0 0 63%',padding:'8px 10px 6px',overflow:'hidden'}}>
        <BodyGrid bp={char.bodyParts} onPartClick={p=>setPartEdit(p)} />
      </div>

      {/* ── Skills (rest) ── */}
      <div style={{flex:1,borderTop:`1px solid ${C.border}`,padding:'6px 8px 8px',overflow:'hidden',minHeight:0}}>
        <SkillBars skills={char.skills} onChange={changeSkill} />
      </div>

      {/* ── Part modal ── */}
      {partEdit && (
        <PartModal
          part={partEdit} bp={char.bodyParts[partEdit]}
          onClose={()=>setPartEdit(null)}
          onSetState={s=>setPartState(partEdit,s)}
          onSetArmorMax={v=>setArmorMax(partEdit,v)}
          onChangeArmor={d=>changeArmor(partEdit,d)}
        />
      )}
    </div>
  );
}

function PlayNavBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:'none',color:C.textDim,fontSize:'0.78rem',
      padding:'5px 9px',border:`1px solid ${C.border}`,borderRadius:4,
      letterSpacing:'1px',flexShrink:0,whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

// ═══ BODY GRID ════════════════════════════════════════════════════════════════
/*
  4-column grid visual:
    .  [HEAD HEAD]  .
  [LA] [TORSO TORSO] [RA]
  [LL  LL] [RL  RL]
*/
function BodyGrid({ bp, onPartClick }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'1fr 1fr 1fr 1fr',
      gridTemplateRows:'1fr 1fr 1fr',
      gap:6, height:'100%',
    }}>
      <BodyPart bp={bp.head}      label="Cabeza"  onClick={()=>onPartClick('head')}     style={{gridColumn:'2/4',gridRow:1}} />
      <BodyPart bp={bp.leftArm}   label="Br.Izq"  onClick={()=>onPartClick('leftArm')}  style={{gridColumn:1,gridRow:2}} />
      <BodyPart bp={bp.torso}     label="Torso"   onClick={()=>onPartClick('torso')}    style={{gridColumn:'2/4',gridRow:2}} />
      <BodyPart bp={bp.rightArm}  label="Br.Der"  onClick={()=>onPartClick('rightArm')} style={{gridColumn:4,gridRow:2}} />
      <BodyPart bp={bp.leftLeg}   label="P.Izq"   onClick={()=>onPartClick('leftLeg')}  style={{gridColumn:'1/3',gridRow:3}} />
      <BodyPart bp={bp.rightLeg}  label="P.Der"   onClick={()=>onPartClick('rightLeg')} style={{gridColumn:'3/5',gridRow:3}} />
    </div>
  );
}

function BodyPart({ bp, label, onClick, style }) {
  const info = STATE_INFO[bp.state];
  return (
    <button onClick={onClick} style={{
      ...style,
      background:info.bg,
      border:`2px solid ${info.border}`,
      borderRadius:10,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
      boxShadow:`0 0 14px ${info.glow}, inset 0 0 10px ${info.glow}`,
      cursor:'pointer',padding:4,position:'relative',overflow:'hidden',
    }}>
      {bp.state==='eliminated' && (
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(-45deg,transparent,transparent 5px,#ffffff08 5px,#ffffff08 6px)',borderRadius:8,pointerEvents:'none'}}/>
      )}
      <div style={{fontSize:'0.58rem',letterSpacing:'2px',color:info.border,opacity:0.85,fontFamily:"'Cinzel',serif",zIndex:1}}>{label.toUpperCase()}</div>
      <div style={{fontSize:'1.5rem',color:info.border,textShadow:`0 0 10px ${info.border}88`,zIndex:1,lineHeight:1}}>{info.icon}</div>
      {bp.state==='armored' && (
        <div style={{fontSize:'0.68rem',color:'#5aade8',letterSpacing:'1px',fontWeight:'bold',zIndex:1}}>
          {bp.armorCurrent}/{bp.armorMax}
        </div>
      )}
      {bp.state==='wounded' && (
        <div style={{fontSize:'0.58rem',color:'#e74c3c',letterSpacing:'1px',zIndex:1}}>HERIDA</div>
      )}
    </button>
  );
}

// ═══ PART MODAL ══════════════════════════════════════════════════════════════

function PartModal({ part, bp, onClose, onSetState, onSetArmorMax, onChangeArmor }) {
  const states = [
    {key:'healthy',   label:'♥ Sano',      desc:'Sin daño'},
    {key:'wounded',   label:'✸ Herida',     desc:'1 herida'},
    {key:'eliminated',label:'✕ Eliminado',  desc:'2 heridas'},
    {key:'armored',   label:'⬡ Armadura',   desc:'Con protección'},
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'#000000aa',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200,backdropFilter:'blur(5px)'}}
      onClick={onClose}>
      <div style={{
        width:'100%',maxWidth:500,
        background:C.surface,border:`1px solid ${C.border}`,
        borderRadius:'18px 18px 0 0',padding:'20px 18px 32px',
        animation:'slideUp 0.25s ease',
      }} onClick={e=>e.stopPropagation()}>
        {/* Handle */}
        <div style={{width:36,height:3,background:C.border,borderRadius:2,margin:'0 auto 16px'}}/>

        <div style={{textAlign:'center',color:C.gold,fontSize:'1rem',fontFamily:"'Cinzel',serif",letterSpacing:'3px',marginBottom:18}}>
          {PART_NAME[part].toUpperCase()}
        </div>

        {/* State buttons */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          {states.map(({key,label,desc})=>{
            const info = STATE_INFO[key];
            const active = bp.state===key;
            return (
              <button key={key} onClick={()=>onSetState(key)} style={{
                padding:'12px 8px',borderRadius:8,
                background: active ? info.bg : C.card,
                border:`2px solid ${active ? info.border : C.border}`,
                color: active ? info.border : C.textDim,
                display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                boxShadow: active ? `0 0 14px ${info.glow}` : 'none',
              }}>
                <span style={{fontSize:'1rem'}}>{label}</span>
                <span style={{fontSize:'0.7rem',opacity:0.7}}>{desc}</span>
              </button>
            );
          })}
        </div>

        {/* Armor config */}
        {bp.state==='armored' && (
          <div style={{background:C.card,border:'1px solid #2980b933',borderRadius:10,padding:14,display:'flex',flexDirection:'column',gap:12}}>
            <div style={{color:'#5aade8',fontSize:'0.75rem',letterSpacing:'3px',textAlign:'center',fontFamily:"'Cinzel',serif"}}>⬡ ARMADURA</div>

            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{color:C.textDim,fontSize:'0.85rem',width:90,flexShrink:0}}>Máx. golpes</div>
              <SmallBtn onClick={()=>onSetArmorMax(Math.max(1,bp.armorMax-1))}>−</SmallBtn>
              <div style={{flex:1,textAlign:'center',color:'#5aade8',fontSize:'1.4rem',fontWeight:'bold'}}>{bp.armorMax}</div>
              <SmallBtn onClick={()=>onSetArmorMax(Math.min(10,bp.armorMax+1))}>+</SmallBtn>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{color:C.textDim,fontSize:'0.85rem',width:90,flexShrink:0}}>Restantes</div>
              <SmallBtn onClick={()=>onChangeArmor(-1)} color="#e74c3c">−</SmallBtn>
              <div style={{flex:1,textAlign:'center',color:bp.armorCurrent===0?'#e74c3c':'#5aade8',fontSize:'1.4rem',fontWeight:'bold'}}>{bp.armorCurrent}</div>
              <SmallBtn onClick={()=>onChangeArmor(+1)}>+</SmallBtn>
            </div>

            {/* Pip display */}
            <div style={{display:'flex',gap:4,justifyContent:'center',flexWrap:'wrap'}}>
              {Array.from({length:bp.armorMax},(_,i)=>(
                <div key={i} style={{
                  width:22,height:22,borderRadius:4,
                  background: i<bp.armorCurrent ? '#2980b9' : C.surface,
                  border:`1px solid ${i<bp.armorCurrent ? '#5aade8' : C.border}`,
                  boxShadow: i<bp.armorCurrent ? '0 0 6px #2980b966' : 'none',
                  transition:'all 0.2s',
                }}/>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{width:'100%',marginTop:14,padding:'12px',background:'none',border:`1px solid ${C.border}`,color:C.textDim,borderRadius:6,fontSize:'0.9rem',letterSpacing:'2px',fontFamily:"'Cinzel',serif"}}>
          CERRAR
        </button>
      </div>
    </div>
  );
}

// ═══ SKILL BARS ══════════════════════════════════════════════════════════════

function SkillBars({ skills, onChange }) {
  return (
    <div style={{display:'flex',gap:5,height:'100%',alignItems:'stretch'}}>
      {SKILLS.map(s => {
        const { current, max } = skills[s];
        const pct = max>0 ? current/max : 0;
        const barColor = pct>0.65 ? C.gold : pct>0.35 ? '#e67e22' : '#e74c3c';

        return (
          <div key={s} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:0}}>

            {/* + arriba */}
            <button onClick={()=>onChange(s,+1)} style={{
              width:'100%',padding:'4px 1px',flexShrink:0,
              background:C.card,border:`1px solid ${C.border}`,
              color:C.gold,fontSize:'1.1rem',borderRadius:4,lineHeight:1.2,
            }}>+</button>

            {/* Cuadrado central con valor actual y fondo de barra */}
            <div style={{flex:1,width:'100%',position:'relative',minHeight:0,borderRadius:6,overflow:'hidden',border:`1px solid ${C.border}`,background:C.card}}>
              {/* fill de fondo */}
              <div style={{
                position:'absolute',bottom:0,left:0,right:0,
                height:`${pct*100}%`,
                background:`linear-gradient(to top,${barColor}55,${barColor}22)`,
                transition:'height 0.3s ease',
              }}/>
              {/* valor actual centrado */}
              <div style={{
                position:'absolute',inset:0,
                display:'flex',alignItems:'center',justifyContent:'center',
                color:barColor,fontSize:'1.15rem',fontWeight:'bold',
                textShadow:`0 0 10px ${barColor}88`,zIndex:1,
              }}>{current}</div>
            </div>

            {/* Máximo abajo — también decrementa al tocar */}
            <button onClick={()=>onChange(s,-1)} style={{
              width:'100%',padding:'4px 1px',flexShrink:0,
              background:C.card,border:`1px solid ${C.border}`,
              color:C.textDim,fontSize:'0.75rem',borderRadius:4,lineHeight:1.3,
            }}>{max}</button>

            {/* Abreviatura */}
            <div style={{fontSize:'0.6rem',color:C.textDim,letterSpacing:'1px',textAlign:'center',fontFamily:"'Cinzel',serif",flexShrink:0}}>
              {SKILL_ABR[s]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
