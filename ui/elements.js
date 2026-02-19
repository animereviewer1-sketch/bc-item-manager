// ── BCIM / ui / elements.js ───────────────────────────────
window.BCIM = window.BCIM || {};

// Core DOM builder
BCIM.el = (tag, attrs={}, ...children) => {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k==='style'&&typeof v==='object') Object.assign(e.style,v);
    else if (k.startsWith('on'))          e.addEventListener(k.slice(2).toLowerCase(),v);
    else                                  e.setAttribute(k,v);
  }
  children.flat().forEach(c=>{if(c==null)return; e.appendChild(typeof c==='string'?document.createTextNode(c):c);});
  return e;
};
const el  = (...a) => BCIM.el(...a);
const $   = (s,ctx=document) => ctx.querySelector(s);
const $$  = (s,ctx=document) => [...ctx.querySelectorAll(s)];
BCIM.$  = $;
BCIM.$$ = $$;

// ── Shared UI components ────────────────────────────────────
BCIM.UI = {
  toggle: (label, checked, onChange) => {
    const row=el('div',{class:'btr'},el('span',{class:'btr-l'},label));
    const lbl=el('label',{class:'btog'});
    const chk=el('input',{type:'checkbox'}); chk.checked=!!checked;
    chk.addEventListener('change',e=>onChange(e.target.checked));
    lbl.appendChild(chk); lbl.appendChild(el('span',{class:'btog-s'}));
    row.appendChild(lbl); return row;
  },

  slider: (label, value, min, max, onChange) => {
    const wrap=el('div',{class:'bf'});
    if(label) wrap.appendChild(el('label',{class:'bl'},label));
    const valEl=el('span',{class:'bslr-v'},String(value));
    const slr=el('input',{type:'range',class:'bslr',min:String(min),max:String(max),value:String(value)});
    slr.addEventListener('input',e=>{onChange(parseFloat(e.target.value));valEl.textContent=e.target.value;});
    wrap.appendChild(el('div',{class:'bslr-r'},slr,valEl));
    return wrap;
  },

  select: (label, options, value, onChange) => {
    const wrap=el('div',{class:'bf'});
    if(label) wrap.appendChild(el('label',{class:'bl'},label));
    const sel=el('select',{class:'bsel'});
    options.forEach(([v,l])=>{const o=el('option',{value:v},l);if(v===value)o.selected=true;sel.appendChild(o);});
    sel.addEventListener('change',e=>onChange(e.target.value));
    wrap.appendChild(sel); return wrap;
  },

  input: (label, value, placeholder, onChange, type='text') => {
    const wrap=el('div',{class:'bf'});
    if(label) wrap.appendChild(el('label',{class:'bl'},label));
    const inp=el('input',{type,class:'bi',value:value||'',placeholder:placeholder||''});
    inp.addEventListener('input',e=>onChange(e.target.value));
    wrap.appendChild(inp); return {wrap, inp};
  },

  section: (title, ...badge) => {
    const s=el('div',{class:'bsh'},el('span',{},title),...badge);
    return s;
  },

  card: (...children) => {
    const c=el('div',{class:'card'}); children.flat().forEach(ch=>{if(ch)c.appendChild(ch);}); return c;
  },

  emptyState: (icon, msg) => el('div',{class:'bempty'},el('div',{class:'bempty-i'},icon),msg),

  confirmOverlay: (msg, onConfirm) => {
    const ov=el('div',{style:{position:'fixed',inset:'0',background:'rgba(0,0,0,.7)',zIndex:'200000',
      display:'flex',alignItems:'center',justifyContent:'center'}});
    const box=el('div',{style:{background:'var(--bg)',border:'1px solid var(--brd)',borderRadius:'12px',
      padding:'18px',maxWidth:'300px',color:'var(--txt)',textAlign:'center'}});
    box.appendChild(el('div',{style:{marginBottom:'14px',fontSize:'13px'}},msg));
    const row=el('div',{style:{display:'flex',gap:'8px',justifyContent:'center'}});
    const yes=el('button',{class:'sbtn sbtn-p'},'Ja, bestätigen');
    const no =el('button',{class:'sbtn'},'Abbrechen');
    yes.addEventListener('click',()=>{ov.remove();onConfirm();});
    no.addEventListener('click',()=>ov.remove());
    row.appendChild(no); row.appendChild(yes);
    box.appendChild(row); ov.appendChild(box);
    ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
  },

  diffModal: (title, diffs) => {
    const SLOT_LABELS = BCIM.SLOT_LABELS||{};
    const ov=el('div',{style:{position:'fixed',inset:'0',background:'rgba(0,0,0,.7)',zIndex:'199999',
      display:'flex',alignItems:'center',justifyContent:'center'}});
    const box=el('div',{style:{background:'var(--bg)',border:'1px solid var(--brd)',borderRadius:'14px',
      padding:'15px',width:'320px',maxHeight:'70vh',overflowY:'auto',color:'var(--txt)'}});
    box.appendChild(el('div',{style:{fontWeight:'600',marginBottom:'8px',color:'var(--acc)'}},title));
    if(!diffs.length) box.appendChild(el('div',{style:{color:'#4ade80'}},'✓ Kein Unterschied'));
    diffs.forEach(d=>{
      const cls=d.type==='added'?'alert-add':d.type==='removed'?'alert-remove':'alert-change';
      const icon=d.type==='added'?'+':d.type==='removed'?'−':'↔';
      const label=SLOT_LABELS[d.group]||d.group;
      const txt=d.type==='changed'?`${label}: ${d.from} → ${d.to}`:`${label}: ${d.assetName}`;
      box.appendChild(el('div',{class:`alert-pill ${cls}`},icon+' ',txt));
    });
    const closeBtn=el('button',{class:'sbtn',style:{marginTop:'10px',width:'100%'}},'Schließen');
    closeBtn.addEventListener('click',()=>ov.remove());
    box.appendChild(closeBtn); ov.appendChild(box);
    ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
  },

  progressBar: (pct, color) => {
    const outer=el('div',{class:'prog-bar'});
    const fill=el('div',{class:'prog-fill',style:{width:Math.min(100,pct)+'%'}});
    if(color) fill.style.background=color;
    outer.appendChild(fill); return outer;
  },
};

// Shared slot labels & order
BCIM.SLOT_LABELS = {
  ItemMouth:'Mund',ItemMouthAccessories:'Mund-A',ItemHead:'Kopf',ItemHair:'Haare',ItemHairFront:'Haare V',
  ItemNeck:'Hals',ItemNeckRestraints:'Hals-R',ItemNeckAccessories:'Hals-A',
  ItemArms:'Arme',ItemHands:'Hände',ItemHandheld:'Hand',
  ItemTorso:'Torso',ItemTorso2:'Torso 2',ItemBreast:'Brust',
  ItemPelvis:'Becken',ItemVulva:'Intimber.',ItemVulvaPiercings:'Piercing',
  ItemButt:'Hintern',ItemLegs:'Beine',ItemFeet:'Füße',
  ItemEars:'Ohren',ItemNose:'Nase',ItemEyes:'Augen',ItemEyesShadow:'Lidsch.',ItemEyesLashes:'Wimpern',
  Cloth:'Oberteil',ClothAccessory:'Ober-A',ClothLower:'Unterteil',
  Gloves:'Handsch.',Shoes:'Schuhe',Socks:'Strümpfe',SocksRight:'Str-R',
  HairAccessory1:'Haarsch1',HairAccessory2:'Haarsch2',HairAccessory3:'Haarsch3',HatAccessory:'Hut',
};
BCIM.SLOT_ORDER = [
  'ItemMouth','ItemArms','ItemHands','ItemTorso','ItemLegs','ItemFeet',
  'ItemHead','ItemNeck','ItemNeckRestraints','ItemNeckAccessories',
  'Cloth','ClothLower','ClothAccessory','Shoes','Gloves','Socks','SocksRight',
  'ItemPelvis','ItemVulva','ItemVulvaPiercings','ItemBreast','ItemButt',
  'ItemEars','ItemNose','ItemEyes','ItemEyesShadow','ItemEyesLashes',
  'ItemHair','ItemHairFront','ItemHandheld','HairAccessory1','HairAccessory2',
  'HairAccessory3','HatAccessory','ItemMouthAccessories',
];
