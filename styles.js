// ── BCIM / styles.js (v3.2) ────────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.THEMES = {
  dark:   {bg:'#0c0c14',bg2:'#101020',bg3:'#17172a',brd:'#232333',acc:'#c084fc',acc2:'#7c3aed',txt:'#ddddf0',txt2:'#888',txt3:'#3a3a5a'},
  purple: {bg:'#0e0618',bg2:'#150d24',bg3:'#1e1033',brd:'#301e50',acc:'#e879f9',acc2:'#a855f7',txt:'#f0e0ff',txt2:'#b088d0',txt3:'#604880'},
  pink:   {bg:'#140810',bg2:'#200f1a',bg3:'#2a1525',brd:'#4a2035',acc:'#f472b6',acc2:'#ec4899',txt:'#ffe4f0',txt2:'#c07090',txt3:'#5a2040'},
};

BCIM._cssEl = null;

BCIM.buildCSS = () => {
  if (!BCIM._cssEl) { BCIM._cssEl = document.createElement('style'); document.head.appendChild(BCIM._cssEl); }
  const t = BCIM.THEMES[BCIM.CFG?.theme||'dark'];
  const vars = Object.entries(t).map(([k,v])=>`--${k}:${v}`).join(';');
  BCIM._cssEl.textContent = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
#bcim-root{${vars}}
#bcim-root *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif;}

/* ─── Root (bigger default: 480×680) ───────────── */
#bcim-root{
  position:fixed;top:40px;right:16px;
  width:480px;height:680px;
  background:var(--bg);border:1px solid var(--brd);border-radius:18px;
  box-shadow:0 32px 90px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.04) inset;
  color:var(--txt);z-index:99999;
  display:flex;flex-direction:column;overflow:hidden;
  font-size:14px;user-select:none;
  opacity:${BCIM.CFG?.opacity||1};transition:opacity .2s;
  min-width:280px;min-height:360px;
}

/* Mini */
#bcim-root.mini #bcim-players,#bcim-root.mini #bcim-tabs,#bcim-root.mini #bcim-content,
#bcim-root.mini #bcim-cfg-wrap,#bcim-root.mini #bcim-act,#bcim-root.mini #bcim-st,
#bcim-root.mini #bcim-resizer{display:none!important;}
#bcim-root.mini{height:auto!important;width:220px!important;}

/* ─── Title bar ─────────────────────────────────── */
#bcim-bar{
  display:flex;align-items:center;gap:7px;padding:12px 15px;
  background:linear-gradient(135deg,var(--bg3),var(--bg2));
  border-bottom:1px solid var(--brd);cursor:grab;flex-shrink:0;
}
#bcim-bar:active{cursor:grabbing;}
#bcim-logo{font-size:12px;font-weight:700;color:var(--acc);letter-spacing:.12em;text-transform:uppercase;flex:1;}
#bcim-scan-badge{
  font-size:10px;padding:2px 7px;border-radius:20px;
  background:color-mix(in srgb,var(--acc) 15%,transparent);
  border:1px solid color-mix(in srgb,var(--acc) 30%,transparent);
  color:var(--acc);font-family:'DM Mono',monospace;cursor:pointer;
  transition:.15s;white-space:nowrap;
}
#bcim-scan-badge:hover{background:color-mix(in srgb,var(--acc) 25%,transparent);}
#bcim-size-btn,#bcim-mini-btn,#bcim-x{
  width:22px;height:22px;border-radius:50%;background:var(--bg2);border:1px solid var(--brd);
  cursor:pointer;color:var(--txt2);font-size:12px;line-height:20px;text-align:center;
  transition:.15s;flex-shrink:0;
}
#bcim-size-btn:hover{background:var(--brd);color:var(--txt);}
#bcim-mini-btn:hover{background:var(--brd);}
#bcim-x:hover{background:#ff4466;color:#fff;border-color:#ff4466;}

/* Size popup */
#bcim-size-popup{
  position:absolute;top:46px;right:56px;
  background:var(--bg);border:1px solid var(--brd);border-radius:12px;
  padding:11px;z-index:100000;width:210px;
  box-shadow:0 14px 45px rgba(0,0,0,.75);
}

/* Resize corner */
#bcim-resizer{position:absolute;bottom:0;right:0;width:20px;height:20px;cursor:se-resize;background:transparent;z-index:10;}
#bcim-resizer::after{
  content:'';position:absolute;bottom:4px;right:4px;width:9px;height:9px;
  border-right:2px solid var(--brd);border-bottom:2px solid var(--brd);
  border-radius:0 0 3px 0;opacity:.55;transition:.15s;
}
#bcim-resizer:hover::after{opacity:1;border-color:var(--acc);}

/* ─── Players ───────────────────────────────────── */
#bcim-players{
  display:flex;gap:5px;padding:7px 12px;overflow-x:auto;
  scrollbar-width:none;border-bottom:1px solid var(--brd);flex-shrink:0;
}
#bcim-players::-webkit-scrollbar{display:none;}
.bp{flex-shrink:0;padding:4px 12px;border-radius:20px;border:1px solid var(--brd);background:transparent;
  color:var(--txt2);font-size:12px;cursor:pointer;transition:.15s;white-space:nowrap;}
.bp:hover{border-color:var(--acc);color:var(--acc);}
.bp.on{background:color-mix(in srgb,var(--acc) 15%,transparent);border-color:var(--acc);color:var(--acc);font-weight:600;}

/* ─── Tabs ──────────────────────────────────────── */
#bcim-tabs{
  display:flex;border-bottom:1px solid var(--brd);background:var(--bg2);
  overflow-x:auto;scrollbar-width:none;flex-shrink:0;
}
#bcim-tabs::-webkit-scrollbar{display:none;}
.bt{flex-shrink:0;flex:1;min-width:34px;padding:9px 4px;text-align:center;cursor:pointer;
  font-size:16px;border:none;background:transparent;border-bottom:2px solid transparent;
  transition:.15s;color:var(--txt3);line-height:1;position:relative;}
.bt:hover{color:var(--txt2);background:color-mix(in srgb,var(--acc) 5%,transparent);}
.bt.on{border-bottom-color:var(--acc);color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);}
.bt-n{position:absolute;top:3px;right:2px;background:var(--acc2);color:#fff;font-size:7px;
  border-radius:8px;padding:1px 3px;font-family:'DM Mono',monospace;line-height:1.2;}

/* ─── Content (flex fill) ───────────────────────── */
#bcim-content{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;display:flex;flex-direction:column;}
#bcim-cfg-wrap{border-top:1px solid var(--brd);padding:12px;overflow-y:auto;max-height:280px;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;flex-shrink:0;}

/* ─── Slot grid ─────────────────────────────────── */
#bcim-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:5px;padding:10px 12px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;}
.bs{padding:6px 3px;border-radius:8px;border:1px solid color-mix(in srgb,var(--brd) 80%,transparent);
  background:var(--bg2);cursor:pointer;text-align:center;transition:.15s;position:relative;}
.bs:hover{border-color:color-mix(in srgb,var(--acc) 50%,transparent);background:var(--bg3);}
.bs.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,transparent);}
.bs.full{border-color:color-mix(in srgb,var(--acc2) 50%,transparent);}
.bs.locked{border-color:color-mix(in srgb,#fb923c 55%,transparent)!important;}
.bs-n{font-size:8px;color:var(--txt3);margin-bottom:2px;line-height:1.2;}
.bs-i{font-size:9px;color:var(--acc);font-weight:600;line-height:1.2;}
.bs-e{font-size:9px;color:color-mix(in srgb,var(--brd) 80%,transparent);}
.bs-fav{position:absolute;top:2px;right:3px;font-size:7px;opacity:.7;}
.bs-lock-icon{position:absolute;bottom:2px;right:3px;font-size:7px;}
.addon-dot{position:absolute;top:2px;left:2px;width:5px;height:5px;border-radius:50%;background:var(--acc);opacity:.8;}

/* ─── Search ────────────────────────────────────── */
#bcim-sq{padding:10px 12px;flex-shrink:0;}
.bcim-search-inp{width:100%;padding:8px 12px;border-radius:9px;border:1px solid var(--brd);background:var(--bg2);color:var(--txt);font-size:13px;outline:none;transition:.15s;}
.bcim-search-inp:focus{border-color:var(--acc);}
#bcim-al{overflow-y:auto;padding:0 12px 8px;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;flex:1;}
.ba{padding:7px 11px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--txt2);transition:.15s;border:1px solid transparent;display:flex;align-items:center;gap:6px;}
.ba:hover{background:var(--bg3);color:var(--txt);}
.ba.on{background:color-mix(in srgb,var(--acc) 12%,transparent);border-color:color-mix(in srgb,var(--acc) 40%,transparent);color:var(--acc);}
.ba-badge{font-size:9px;padding:1px 6px;border-radius:8px;background:var(--bg3);color:var(--acc);flex-shrink:0;}
.ba-fav{font-size:11px;cursor:pointer;opacity:.35;transition:.15s;margin-left:auto;flex-shrink:0;}
.ba-fav:hover,.ba-fav.on{opacity:1;}

/* ─── Actions bar ───────────────────────────────── */
#bcim-act{display:flex;gap:6px;padding:9px 12px;border-top:1px solid var(--brd);flex-shrink:0;}
.bbt{flex:1;padding:10px;border-radius:10px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;}
.bbt-p{background:linear-gradient(135deg,var(--acc2),var(--acc));color:#fff;}
.bbt-p:hover{filter:brightness(1.2);transform:translateY(-1px);box-shadow:0 6px 20px color-mix(in srgb,var(--acc) 40%,transparent);}
.bbt-d{background:color-mix(in srgb,#ff4466 10%,transparent);color:#ff6680;border:1px solid color-mix(in srgb,#ff4466 20%,transparent);}
.bbt-d:hover{background:color-mix(in srgb,#ff4466 20%,transparent);}
.bbt-g{background:var(--bg2);color:var(--txt2);border:1px solid var(--brd);flex:0 0 36px;}
.bbt-g:hover{color:var(--txt);}
.bbt:active{transform:scale(.97);}
#bcim-st{text-align:center;font-size:12px;padding:3px 12px 8px;min-height:22px;flex-shrink:0;}
.st-ok{color:#4ade80;}.st-err{color:#ff6680;}.st-info{color:var(--acc);}.st-warn{color:#fb923c;}

/* ─── Tab body ──────────────────────────────────── */
.tab-body{padding:12px;overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;}
.bsh{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.1em;margin:14px 0 7px;display:flex;align-items:center;gap:6px;}
.bsh:first-child{margin-top:0;}
.bsh::after{content:'';flex:1;height:1px;background:var(--brd);}
.arch{font-size:9px;padding:2px 7px;border-radius:7px;background:var(--bg2);color:var(--acc2);font-weight:700;}

/* ─── Fields ────────────────────────────────────── */
.bf{margin-bottom:8px;}
.bl{font-size:11px;color:var(--txt2);margin-bottom:4px;display:block;}
.bi,.bsel,.bta{width:100%;padding:7px 10px;border-radius:8px;border:1px solid var(--brd);background:var(--bg2);color:var(--txt);font-size:13px;outline:none;font-family:inherit;transition:.15s;}
.bi:focus,.bsel:focus,.bta:focus{border-color:var(--acc);}
.bsel option{background:var(--bg3);}
.bta{resize:vertical;min-height:44px;}

/* ─── Colors ────────────────────────────────────── */
.bcg{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;}
.bci{display:flex;flex-direction:column;align-items:center;gap:3px;}
.bcl{font-size:8px;color:var(--txt3);}
.bcp{width:36px;height:36px;border-radius:8px;border:2px solid var(--brd);cursor:pointer;padding:2px;background:var(--bg2);transition:.15s;}
.bcp:hover{border-color:var(--acc);}
.bck{width:36px;height:36px;border-radius:8px;background:var(--bg2);border:2px solid var(--brd);display:flex;align-items:center;justify-content:center;font-size:12px;}

/* ─── Tags ──────────────────────────────────────── */
.btags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:3px;}
.btag{padding:4px 11px;border-radius:20px;font-size:12px;border:1px solid var(--brd);background:transparent;color:var(--txt2);cursor:pointer;transition:.15s;white-space:nowrap;}
.btag:hover{border-color:color-mix(in srgb,var(--acc) 50%,transparent);color:var(--acc);}
.btag.on{background:color-mix(in srgb,var(--acc) 15%,transparent);border-color:var(--acc);color:var(--acc);font-weight:600;}

/* ─── Modular ───────────────────────────────────── */
.bmod{border:1px solid var(--brd);border-radius:10px;padding:10px;margin-bottom:8px;}
.bmod-t{font-size:11px;color:var(--acc2);margin-bottom:6px;font-weight:600;}
.bmod-sub{font-size:9px;color:var(--txt3);margin-top:4px;}

/* ─── Toggle ────────────────────────────────────── */
.btr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;}
.btr-l{font-size:13px;color:var(--txt2);flex:1;}
.btog{position:relative;width:36px;height:20px;flex-shrink:0;}
.btog input{opacity:0;width:0;height:0;}
.btog-s{position:absolute;inset:0;border-radius:20px;background:var(--brd);cursor:pointer;transition:.2s;}
.btog-s:before{content:'';position:absolute;width:14px;height:14px;border-radius:50%;left:3px;top:3px;background:var(--txt2);transition:.2s;}
.btog input:checked+.btog-s{background:var(--acc2);}
.btog input:checked+.btog-s:before{transform:translateX(16px);background:#fff;}

/* ─── Slider ────────────────────────────────────── */
.bslr{width:100%;accent-color:var(--acc);appearance:none;height:4px;border-radius:4px;background:var(--brd);outline:none;cursor:pointer;}
.bslr-r{display:flex;gap:8px;align-items:center;}
.bslr-v{font-size:12px;color:var(--acc);min-width:30px;text-align:right;font-family:'DM Mono',monospace;}

/* ─── Cards ─────────────────────────────────────── */
.card{background:var(--bg2);border:1px solid var(--brd);border-radius:11px;padding:11px;margin-bottom:7px;transition:.15s;}
.card:hover{border-color:color-mix(in srgb,var(--acc) 25%,transparent);}
.card-title{font-size:13px;font-weight:600;color:var(--txt);margin-bottom:3px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.card-sub{font-size:11px;color:var(--txt2);}
.card-row{display:flex;align-items:center;gap:6px;}
.card-actions{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;}

/* ─── Small buttons ─────────────────────────────── */
.sbtn{padding:5px 11px;border-radius:8px;border:1px solid var(--brd);background:transparent;color:var(--txt2);font-size:12px;cursor:pointer;transition:.15s;white-space:nowrap;}
.sbtn:hover{border-color:var(--acc);color:var(--acc);}
.sbtn-p{background:linear-gradient(135deg,var(--acc2),var(--acc));color:#fff!important;border:none;}
.sbtn-p:hover{filter:brightness(1.15);}
.sbtn-d{color:#ff6680;border-color:color-mix(in srgb,#ff4466 30%,transparent);}
.sbtn-d:hover{background:color-mix(in srgb,#ff4466 10%,transparent);}
.sbtn:active{transform:scale(.96);}

/* ─── Alerts ────────────────────────────────────── */
.alert-pill{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;border:1px solid;margin-bottom:4px;}
.alert-add{background:color-mix(in srgb,#4ade80 10%,transparent);border-color:color-mix(in srgb,#4ade80 30%,transparent);color:#4ade80;}
.alert-remove{background:color-mix(in srgb,#ff6680 10%,transparent);border-color:color-mix(in srgb,#ff6680 30%,transparent);color:#ff6680;}
.alert-change{background:color-mix(in srgb,var(--acc) 10%,transparent);border-color:color-mix(in srgb,var(--acc) 30%,transparent);color:var(--acc);}
.alert-prop{background:color-mix(in srgb,#fb923c 10%,transparent);border-color:color-mix(in srgb,#fb923c 30%,transparent);color:#fb923c;}

/* ─── Heatmap ───────────────────────────────────── */
.hbar{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
.hbar-label{font-size:12px;color:var(--txt2);width:90px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hbar-track{flex:1;background:var(--bg2);border-radius:4px;height:6px;overflow:hidden;}
.hbar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .3s;}
.hbar-val{font-size:11px;color:var(--txt3);font-family:'DM Mono',monospace;width:32px;text-align:right;flex-shrink:0;}

/* ─── Body map ──────────────────────────────────── */
#bcim-body-map{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:10px 12px;}
.bzone{padding:7px 9px;border-radius:8px;border:1px solid var(--brd);background:var(--bg2);cursor:pointer;text-align:center;transition:.15s;font-size:12px;color:var(--txt2);display:flex;align-items:center;justify-content:center;gap:4px;}
.bzone:hover{border-color:var(--acc);color:var(--acc);}
.bzone.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,transparent);color:var(--acc);}
.bzone.full{border-color:color-mix(in srgb,var(--acc2) 40%,transparent);color:var(--txt);}

/* ─── Misc ──────────────────────────────────────── */
.encoded-type{font-family:'DM Mono',monospace;font-size:10px;color:var(--txt2);background:var(--bg2);border:1px solid var(--brd);border-radius:5px;padding:4px 8px;margin-top:5px;word-break:break-all;}
.binfo{font-size:11px;color:var(--txt3);font-style:italic;margin-top:3px;margin-bottom:5px;}
.lock-timer{font-family:'DM Mono',monospace;font-size:12px;color:var(--acc);}
.section-note{font-size:11px;color:var(--txt2);line-height:1.5;margin-bottom:8px;}
.bempty{text-align:center;color:var(--txt3);font-size:12px;padding:24px 12px;}
.bempty-i{font-size:32px;margin-bottom:8px;}
.inp-row{display:flex;gap:6px;margin-bottom:8px;}
.inp-row .bi,.inp-row .bsel{flex:1;}

/* ─── Theme / Icons ─────────────────────────────── */
.theme-swatch{width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:.15s;}
.theme-swatch.on{border-color:var(--txt);transform:scale(1.15);}
.icon-grid{display:flex;flex-wrap:wrap;gap:4px;}
.icon-btn{width:28px;height:28px;font-size:14px;border:1px solid var(--brd);border-radius:7px;background:transparent;cursor:pointer;transition:.15s;line-height:26px;text-align:center;}
.icon-btn:hover{border-color:var(--acc);}
.icon-btn.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 15%,transparent);}

/* ─── Karma ─────────────────────────────────────── */
.karma-bar-outer{background:var(--bg2);border-radius:20px;height:16px;overflow:hidden;margin:6px 0;border:1px solid var(--brd);}
.karma-bar-inner{height:100%;border-radius:20px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .5s;}
.karma-pts{font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:var(--acc);text-align:center;margin:5px 0;}
.combo-pill{display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:20px;font-size:12px;background:color-mix(in srgb,#fb923c 15%,transparent);border:1px solid color-mix(in srgb,#fb923c 40%,transparent);color:#fb923c;margin:2px;}

/* ─── Roulette / Games ──────────────────────────── */
.roulette-result{font-size:24px;font-weight:700;color:var(--acc);min-height:40px;text-align:center;margin:7px 0;line-height:1.3;}

/* ─── Sequence ──────────────────────────────────── */
.seq-step{display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:9px;border:1px solid var(--brd);background:var(--bg2);margin-bottom:5px;}
.seq-step.running{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);}
.seq-step.done{opacity:.45;}
.seq-step-num{font-family:'DM Mono',monospace;font-size:10px;color:var(--txt3);width:20px;flex-shrink:0;}
.seq-step-label{flex:1;font-size:12px;color:var(--txt);}
.seq-step-delay{font-size:10px;color:var(--txt3);font-family:'DM Mono',monospace;}

/* ─── Chat triggers ─────────────────────────────── */
.trigger-row{display:flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid var(--brd);border-radius:9px;background:var(--bg2);margin-bottom:5px;}
.trigger-kw{font-family:'DM Mono',monospace;font-size:12px;color:var(--acc);flex-shrink:0;}
.trigger-action{font-size:11px;color:var(--txt2);flex:1;}
.trigger-active{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.trigger-active.on{background:#4ade80;}
.trigger-active.off{background:var(--txt3);}

/* ─── Command palette ───────────────────────────── */
#bcim-palette-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:199998;display:flex;align-items:flex-start;justify-content:center;padding-top:80px;}
#bcim-palette{width:500px;background:var(--bg);border:1px solid var(--brd);border-radius:16px;overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,.85);}
#bcim-palette-input{width:100%;padding:14px 18px;border:none;background:transparent;color:var(--txt);font-size:15px;outline:none;}
#bcim-palette-list{max-height:340px;overflow-y:auto;border-top:1px solid var(--brd);}
.palette-item{padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:.1s;}
.palette-item:hover,.palette-item.focused{background:color-mix(in srgb,var(--acc) 10%,transparent);}
.palette-icon{font-size:15px;width:24px;text-align:center;flex-shrink:0;}
.palette-label{flex:1;font-size:14px;color:var(--txt);}
.palette-sub{font-size:12px;color:var(--txt2);}
.palette-kbd{font-size:10px;color:var(--txt3);font-family:'DM Mono',monospace;background:var(--bg2);border:1px solid var(--brd);border-radius:4px;padding:1px 5px;}

/* ─── Progress / win ────────────────────────────── */
.prog-bar{background:var(--bg2);border-radius:4px;height:7px;overflow:hidden;margin-top:5px;}
.prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .3s;}
.win-row{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid var(--brd);border-radius:9px;background:var(--bg2);margin-bottom:5px;}
.win-pts{font-family:'DM Mono',monospace;font-size:13px;color:var(--acc);font-weight:700;min-width:38px;}
.win-label{flex:1;font-size:12px;color:var(--txt);}

/* ─── Color palette ─────────────────────────────── */
.pal-row{display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
.pal-swatch{width:22px;height:22px;border-radius:5px;border:1px solid var(--brd);cursor:pointer;transition:.15s;}
.pal-swatch:hover{transform:scale(1.2);}

/* ─── 3-Phasen Item Manager ─────────────────────────── */
/* content area als flex-column */
#bcim-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}

/* Phase 1: Slot-Grid — kompakt oben */
#bcim-phase-slots{flex-shrink:0;overflow-y:auto;max-height:200px;
  scrollbar-width:thin;scrollbar-color:var(--brd) transparent;}

/* Phase 2: Item-Browser */
#bcim-phase-browser{flex:0 0 auto;display:flex;flex-direction:column;
  max-height:260px;border-top:2px solid var(--acc);
  background:color-mix(in srgb,var(--acc) 4%,transparent);}
#bcim-browser-hdr{padding:7px 12px 5px;display:flex;flex-direction:column;gap:5px;
  flex-shrink:0;background:color-mix(in srgb,var(--acc) 6%,transparent);
  border-bottom:1px solid var(--brd);}
#bcim-asset-list{overflow-y:auto;flex:1;padding:4px 8px;
  scrollbar-width:thin;scrollbar-color:var(--brd) transparent;}

/* Phase 3: Konfigurator */
#bcim-phase-cfg{flex:1;overflow-y:auto;border-top:2px solid var(--acc2);
  scrollbar-width:thin;scrollbar-color:var(--brd) transparent;}
#bcim-cfg-content{padding:10px 12px 4px;}

/* Action bar */
#bcim-act{display:flex;gap:6px;padding:8px 12px;border-top:1px solid var(--brd);flex-shrink:0;}

/* Asset list rows */
.ba{padding:6px 10px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--txt2);
  transition:.12s;border:1px solid transparent;display:flex;align-items:center;gap:6px;
  margin-bottom:2px;}
.ba:hover{background:var(--bg3);color:var(--txt);}
.ba.on{background:color-mix(in srgb,var(--acc) 12%,transparent);
  border-color:color-mix(in srgb,var(--acc) 35%,transparent);color:var(--acc);}
.ba-worn{background:color-mix(in srgb,var(--acc2) 7%,transparent);}
.ba-badge{font-size:9px;padding:1px 6px;border-radius:8px;background:var(--bg3);
  color:var(--acc);flex-shrink:0;white-space:nowrap;}
.ba-fav{font-size:11px;cursor:pointer;opacity:.3;transition:.15s;flex-shrink:0;}
.ba-fav:hover,.ba-fav.on{opacity:1;}

/* Action buttons */
.bbt{flex:1;padding:10px;border-radius:10px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;}
.bbt-p{background:linear-gradient(135deg,var(--acc2),var(--acc));color:#fff;}
.bbt-p:hover{filter:brightness(1.15);transform:translateY(-1px);}
.bbt-d{background:color-mix(in srgb,#ff4466 10%,transparent);color:#ff6680;border:1px solid color-mix(in srgb,#ff4466 20%,transparent);}
.bbt-d:hover{background:color-mix(in srgb,#ff4466 20%,transparent);}
.bbt-g{background:var(--bg2);color:var(--txt2);border:1px solid var(--brd);flex:0 0 36px;}
.bbt-g:hover{color:var(--txt);}
.bbt:active{transform:scale(.97);}

/* ─── Scrollbars ────────────────────────────────── */
#bcim-root ::-webkit-scrollbar{width:3px;}
#bcim-root ::-webkit-scrollbar-thumb{background:var(--brd);border-radius:3px;}
`;
};
