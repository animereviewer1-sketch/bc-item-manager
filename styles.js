// ── BCIM / styles.js (v3.1) ────────────────────────────────
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

/* ─── Root panel ─────────────────────────────────── */
#bcim-root{
  position:fixed;top:60px;right:20px;
  width:320px;height:520px;
  background:var(--bg);border:1px solid var(--brd);border-radius:18px;
  box-shadow:0 32px 90px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.03) inset;
  color:var(--txt);z-index:99999;
  display:flex;flex-direction:column;overflow:hidden;
  font-size:13px;user-select:none;
  opacity:${BCIM.CFG?.opacity||1};transition:opacity .2s;
  min-width:240px;min-height:320px;
}

/* ─── Mini mode ─────────────────────────────────── */
#bcim-root.mini #bcim-players,#bcim-root.mini #bcim-tabs,#bcim-root.mini #bcim-content,
#bcim-root.mini #bcim-cfg-wrap,#bcim-root.mini #bcim-act,#bcim-root.mini #bcim-st,
#bcim-root.mini #bcim-resizer{display:none!important;}
#bcim-root.mini{height:auto!important;width:200px!important;}

/* ─── Title bar ─────────────────────────────────── */
#bcim-bar{
  display:flex;align-items:center;gap:6px;padding:10px 12px;
  background:linear-gradient(135deg,var(--bg3),var(--bg2));
  border-bottom:1px solid var(--brd);cursor:grab;flex-shrink:0;
}
#bcim-bar:active{cursor:grabbing;}
#bcim-logo{font-size:11px;font-weight:600;color:var(--acc);letter-spacing:.1em;text-transform:uppercase;flex:1;}
#bcim-size-btn,#bcim-mini-btn,#bcim-x{
  width:20px;height:20px;border-radius:50%;background:var(--bg2);border:1px solid var(--brd);
  cursor:pointer;color:var(--txt2);font-size:11px;line-height:18px;text-align:center;
  transition:.15s;flex-shrink:0;
}
#bcim-size-btn:hover{background:var(--brd);color:var(--txt);}
#bcim-mini-btn:hover{background:var(--brd);}
#bcim-x:hover{background:#ff4466;color:#fff;border-color:#ff4466;}

/* ─── Size popup ────────────────────────────────── */
#bcim-size-popup{
  position:absolute;top:40px;right:50px;
  background:var(--bg);border:1px solid var(--brd);border-radius:12px;
  padding:10px;z-index:99999;width:200px;
  box-shadow:0 12px 40px rgba(0,0,0,.7);
}

/* ─── Resize handle ─────────────────────────────── */
#bcim-resizer{
  position:absolute;bottom:0;right:0;width:18px;height:18px;cursor:se-resize;
  background:transparent;z-index:10;
}
#bcim-resizer::after{
  content:'';position:absolute;bottom:4px;right:4px;
  width:8px;height:8px;
  border-right:2px solid var(--brd);border-bottom:2px solid var(--brd);
  border-radius:0 0 3px 0;opacity:.6;transition:.15s;
}
#bcim-resizer:hover::after{opacity:1;border-color:var(--acc);}

/* ─── Players ───────────────────────────────────── */
#bcim-players{
  display:flex;gap:4px;padding:6px 10px;overflow-x:auto;
  scrollbar-width:none;border-bottom:1px solid var(--brd);flex-shrink:0;
}
#bcim-players::-webkit-scrollbar{display:none;}
.bp{flex-shrink:0;padding:3px 10px;border-radius:20px;border:1px solid var(--brd);background:transparent;
  color:var(--txt2);font-size:11px;cursor:pointer;transition:.15s;white-space:nowrap;}
.bp:hover{border-color:var(--acc);color:var(--acc);}
.bp.on{background:color-mix(in srgb,var(--acc) 15%,transparent);border-color:var(--acc);color:var(--acc);font-weight:600;}

/* ─── Tabs ──────────────────────────────────────── */
#bcim-tabs{
  display:flex;border-bottom:1px solid var(--brd);background:var(--bg2);
  overflow-x:auto;scrollbar-width:none;flex-shrink:0;
}
#bcim-tabs::-webkit-scrollbar{display:none;}
.bt{flex-shrink:0;flex:1;min-width:32px;padding:7px 3px;text-align:center;cursor:pointer;
  font-size:14px;border:none;background:transparent;border-bottom:2px solid transparent;
  transition:.15s;color:var(--txt3);line-height:1;position:relative;}
.bt:hover{color:var(--txt2);background:color-mix(in srgb,var(--acc) 5%,transparent);}
.bt.on{border-bottom-color:var(--acc);color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);}
.bt-n{position:absolute;top:2px;right:2px;background:var(--acc2);color:#fff;font-size:7px;
  border-radius:8px;padding:1px 3px;font-family:'DM Mono',monospace;line-height:1.2;}

/* ─── Content area (fills remaining space) ──────── */
#bcim-content{
  flex:1;overflow-y:auto;overflow-x:hidden;
  scrollbar-width:thin;scrollbar-color:var(--brd) transparent;
  display:flex;flex-direction:column;
}
#bcim-cfg-wrap{
  border-top:1px solid var(--brd);padding:10px;
  overflow-y:auto;max-height:240px;
  scrollbar-width:thin;scrollbar-color:var(--brd) transparent;flex-shrink:0;
}

/* ─── Slot grid ─────────────────────────────────── */
#bcim-slots{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));
  gap:4px;padding:8px 10px;
  overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;
}
.bs{padding:4px 2px;border-radius:7px;border:1px solid color-mix(in srgb,var(--brd) 80%,transparent);
  background:var(--bg2);cursor:pointer;text-align:center;transition:.15s;position:relative;}
.bs:hover{border-color:color-mix(in srgb,var(--acc) 50%,transparent);background:var(--bg3);}
.bs.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,transparent);}
.bs.full{border-color:color-mix(in srgb,var(--acc2) 45%,transparent);}
.bs.locked{border-color:color-mix(in srgb,#fb923c 50%,transparent)!important;}
.bs-n{font-size:7px;color:var(--txt3);margin-bottom:2px;line-height:1.2;}
.bs-i{font-size:8px;color:var(--acc);font-weight:600;line-height:1.2;}
.bs-e{font-size:8px;color:color-mix(in srgb,var(--brd) 80%,transparent);}
.bs-fav{position:absolute;top:1px;right:2px;font-size:7px;opacity:.7;}
.bs-lock-icon{position:absolute;bottom:1px;right:2px;font-size:6px;opacity:.8;}
.addon-dot{position:absolute;top:2px;left:2px;width:4px;height:4px;border-radius:50%;background:var(--acc);opacity:.8;}

/* ─── Search ────────────────────────────────────── */
#bcim-sq{padding:8px 10px;flex-shrink:0;}
.bcim-search-inp{width:100%;padding:7px 10px;border-radius:8px;border:1px solid var(--brd);
  background:var(--bg2);color:var(--txt);font-size:12px;outline:none;transition:.15s;}
.bcim-search-inp:focus{border-color:var(--acc);}
#bcim-al{overflow-y:auto;padding:0 10px 7px;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;flex:1;}
.ba{padding:5px 9px;border-radius:7px;cursor:pointer;font-size:12px;color:var(--txt2);
  transition:.15s;border:1px solid transparent;display:flex;align-items:center;gap:5px;}
.ba:hover{background:var(--bg3);color:var(--txt);}
.ba.on{background:color-mix(in srgb,var(--acc) 10%,transparent);border-color:color-mix(in srgb,var(--acc) 40%,transparent);color:var(--acc);}
.ba-badge{font-size:9px;padding:1px 5px;border-radius:8px;background:var(--bg3);color:var(--acc);flex-shrink:0;}
.ba-fav{font-size:10px;cursor:pointer;opacity:.35;transition:.15s;margin-left:auto;flex-shrink:0;}
.ba-fav:hover,.ba-fav.on{opacity:1;}

/* ─── Actions bar ───────────────────────────────── */
#bcim-act{display:flex;gap:5px;padding:7px 10px;border-top:1px solid var(--brd);flex-shrink:0;}
.bbt{flex:1;padding:8px;border-radius:9px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:.15s;}
.bbt-p{background:linear-gradient(135deg,var(--acc2),var(--acc));color:#fff;}
.bbt-p:hover{filter:brightness(1.2);transform:translateY(-1px);box-shadow:0 5px 18px color-mix(in srgb,var(--acc) 40%,transparent);}
.bbt-d{background:color-mix(in srgb,#ff4466 10%,transparent);color:#ff6680;border:1px solid color-mix(in srgb,#ff4466 20%,transparent);}
.bbt-d:hover{background:color-mix(in srgb,#ff4466 20%,transparent);}
.bbt-g{background:var(--bg2);color:var(--txt2);border:1px solid var(--brd);flex:0 0 32px;}
.bbt-g:hover{color:var(--txt);}
.bbt:active{transform:scale(.97);}
#bcim-st{text-align:center;font-size:11px;padding:2px 10px 6px;min-height:20px;flex-shrink:0;}
.st-ok{color:#4ade80;}.st-err{color:#ff6680;}.st-info{color:var(--acc);}.st-warn{color:#fb923c;}

/* ─── Tab body (scrollable) ─────────────────────── */
.tab-body{padding:10px;overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:var(--brd) transparent;}
.bsh{font-size:10px;font-weight:600;color:var(--txt3);text-transform:uppercase;letter-spacing:.08em;
  margin:12px 0 6px;display:flex;align-items:center;gap:5px;}
.bsh:first-child{margin-top:0;}
.bsh::after{content:'';flex:1;height:1px;background:var(--brd);}
.arch{font-size:9px;padding:2px 6px;border-radius:7px;background:var(--bg2);color:var(--acc2);font-weight:700;}

/* ─── Form fields ───────────────────────────────── */
.bf{margin-bottom:7px;}
.bl{font-size:10px;color:var(--txt2);margin-bottom:3px;display:block;}
.bi,.bsel,.bta{
  width:100%;padding:6px 9px;border-radius:7px;border:1px solid var(--brd);
  background:var(--bg2);color:var(--txt);font-size:12px;outline:none;font-family:inherit;transition:.15s;
}
.bi:focus,.bsel:focus,.bta:focus{border-color:var(--acc);}
.bsel option{background:var(--bg3);}
.bta{resize:vertical;min-height:42px;}

/* ─── Colors ────────────────────────────────────── */
.bcg{display:flex;gap:5px;flex-wrap:wrap;align-items:flex-start;}
.bci{display:flex;flex-direction:column;align-items:center;gap:2px;}
.bcl{font-size:8px;color:var(--txt3);}
.bcp{width:32px;height:32px;border-radius:7px;border:2px solid var(--brd);cursor:pointer;padding:2px;background:var(--bg2);transition:.15s;}
.bcp:hover{border-color:var(--acc);}
.bck{width:32px;height:32px;border-radius:7px;background:var(--bg2);border:2px solid var(--brd);
  display:flex;align-items:center;justify-content:center;font-size:11px;}

/* ─── Tags / Pills ──────────────────────────────── */
.btags{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:2px;}
.btag{padding:3px 9px;border-radius:20px;font-size:11px;border:1px solid var(--brd);
  background:transparent;color:var(--txt2);cursor:pointer;transition:.15s;white-space:nowrap;}
.btag:hover{border-color:color-mix(in srgb,var(--acc) 50%,transparent);color:var(--acc);}
.btag.on{background:color-mix(in srgb,var(--acc) 15%,transparent);border-color:var(--acc);color:var(--acc);font-weight:600;}

/* ─── Modular ───────────────────────────────────── */
.bmod{border:1px solid var(--brd);border-radius:9px;padding:9px;margin-bottom:7px;}
.bmod-t{font-size:10px;color:var(--acc2);margin-bottom:5px;font-weight:600;}
.bmod-sub{font-size:9px;color:var(--txt3);margin-top:3px;}

/* ─── Toggle ────────────────────────────────────── */
.btr{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;gap:8px;}
.btr-l{font-size:12px;color:var(--txt2);flex:1;}
.btog{position:relative;width:34px;height:19px;flex-shrink:0;}
.btog input{opacity:0;width:0;height:0;}
.btog-s{position:absolute;inset:0;border-radius:20px;background:var(--brd);cursor:pointer;transition:.2s;}
.btog-s:before{content:'';position:absolute;width:13px;height:13px;border-radius:50%;left:3px;top:3px;background:var(--txt2);transition:.2s;}
.btog input:checked+.btog-s{background:var(--acc2);}
.btog input:checked+.btog-s:before{transform:translateX(15px);background:#fff;}

/* ─── Slider ────────────────────────────────────── */
.bslr{width:100%;accent-color:var(--acc);appearance:none;height:3px;border-radius:3px;background:var(--brd);outline:none;cursor:pointer;}
.bslr-r{display:flex;gap:7px;align-items:center;}
.bslr-v{font-size:11px;color:var(--acc);min-width:28px;text-align:right;font-family:'DM Mono',monospace;}

/* ─── Cards ─────────────────────────────────────── */
.card{background:var(--bg2);border:1px solid var(--brd);border-radius:10px;padding:9px;margin-bottom:6px;transition:.15s;}
.card:hover{border-color:color-mix(in srgb,var(--acc) 25%,transparent);}
.card-title{font-size:12px;font-weight:600;color:var(--txt);margin-bottom:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.card-sub{font-size:10px;color:var(--txt2);}
.card-row{display:flex;align-items:center;gap:5px;}
.card-actions{display:flex;gap:4px;margin-top:7px;flex-wrap:wrap;}

/* ─── Small buttons ─────────────────────────────── */
.sbtn{padding:4px 9px;border-radius:7px;border:1px solid var(--brd);background:transparent;
  color:var(--txt2);font-size:11px;cursor:pointer;transition:.15s;white-space:nowrap;}
.sbtn:hover{border-color:var(--acc);color:var(--acc);}
.sbtn-p{background:linear-gradient(135deg,var(--acc2),var(--acc));color:#fff!important;border:none;}
.sbtn-p:hover{filter:brightness(1.15);}
.sbtn-d{color:#ff6680;border-color:color-mix(in srgb,#ff4466 30%,transparent);}
.sbtn-d:hover{background:color-mix(in srgb,#ff4466 10%,transparent);}
.sbtn:active{transform:scale(.96);}

/* ─── Alerts ────────────────────────────────────── */
.alert-pill{display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;border:1px solid;margin-bottom:3px;}
.alert-add{background:color-mix(in srgb,#4ade80 10%,transparent);border-color:color-mix(in srgb,#4ade80 30%,transparent);color:#4ade80;}
.alert-remove{background:color-mix(in srgb,#ff6680 10%,transparent);border-color:color-mix(in srgb,#ff6680 30%,transparent);color:#ff6680;}
.alert-change{background:color-mix(in srgb,var(--acc) 10%,transparent);border-color:color-mix(in srgb,var(--acc) 30%,transparent);color:var(--acc);}
.alert-prop{background:color-mix(in srgb,#fb923c 10%,transparent);border-color:color-mix(in srgb,#fb923c 30%,transparent);color:#fb923c;}

/* ─── Heatmap ───────────────────────────────────── */
.hbar{display:flex;align-items:center;gap:7px;margin-bottom:4px;}
.hbar-label{font-size:11px;color:var(--txt2);width:80px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hbar-track{flex:1;background:var(--bg2);border-radius:3px;height:5px;overflow:hidden;}
.hbar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .3s;}
.hbar-val{font-size:10px;color:var(--txt3);font-family:'DM Mono',monospace;width:28px;text-align:right;flex-shrink:0;}

/* ─── Body map ──────────────────────────────────── */
#bcim-body-map{display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:8px 10px;}
.bzone{padding:5px 7px;border-radius:7px;border:1px solid var(--brd);background:var(--bg2);cursor:pointer;
  text-align:center;transition:.15s;font-size:10px;color:var(--txt2);display:flex;align-items:center;justify-content:center;gap:3px;}
.bzone:hover{border-color:var(--acc);color:var(--acc);}
.bzone.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,transparent);color:var(--acc);}
.bzone.full{border-color:color-mix(in srgb,var(--acc2) 40%,transparent);color:var(--txt);}

/* ─── Misc ──────────────────────────────────────── */
.encoded-type{font-family:'DM Mono',monospace;font-size:10px;color:var(--txt2);background:var(--bg2);
  border:1px solid var(--brd);border-radius:5px;padding:3px 7px;margin-top:4px;word-break:break-all;}
.binfo{font-size:10px;color:var(--txt3);font-style:italic;margin-top:2px;margin-bottom:4px;}
.lock-timer{font-family:'DM Mono',monospace;font-size:11px;color:var(--acc);}
.section-note{font-size:10px;color:var(--txt2);line-height:1.4;margin-bottom:7px;}
.bempty{text-align:center;color:var(--txt3);font-size:11px;padding:20px 10px;}
.bempty-i{font-size:28px;margin-bottom:7px;}
.inp-row{display:flex;gap:5px;margin-bottom:7px;}
.inp-row .bi,.inp-row .bsel{flex:1;}

/* ─── Theme swatches / icons ─────────────────────── */
.theme-swatch{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:.15s;}
.theme-swatch.on{border-color:var(--txt);transform:scale(1.15);}
.icon-grid{display:flex;flex-wrap:wrap;gap:3px;}
.icon-btn{width:26px;height:26px;font-size:13px;border:1px solid var(--brd);border-radius:6px;background:transparent;
  cursor:pointer;transition:.15s;line-height:24px;text-align:center;}
.icon-btn:hover{border-color:var(--acc);}
.icon-btn.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 15%,transparent);}

/* ─── Karma ─────────────────────────────────────── */
.karma-bar-outer{background:var(--bg2);border-radius:20px;height:14px;overflow:hidden;margin:5px 0;border:1px solid var(--brd);}
.karma-bar-inner{height:100%;border-radius:20px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .5s;}
.karma-pts{font-family:'DM Mono',monospace;font-size:18px;font-weight:600;color:var(--acc);text-align:center;margin:4px 0;}
.combo-pill{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:20px;font-size:11px;
  background:color-mix(in srgb,#fb923c 15%,transparent);border:1px solid color-mix(in srgb,#fb923c 40%,transparent);
  color:#fb923c;margin:2px;}

/* ─── Roulette / Games ──────────────────────────── */
.roulette-result{font-size:22px;font-weight:700;color:var(--acc);min-height:36px;text-align:center;margin:6px 0;line-height:1.3;}

/* ─── Sequence ──────────────────────────────────── */
.seq-step{display:flex;align-items:center;gap:5px;padding:6px 8px;border-radius:8px;border:1px solid var(--brd);
  background:var(--bg2);margin-bottom:4px;}
.seq-step.running{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);}
.seq-step.done{opacity:.45;}
.seq-step-num{font-family:'DM Mono',monospace;font-size:10px;color:var(--txt3);width:18px;flex-shrink:0;}
.seq-step-label{flex:1;font-size:11px;color:var(--txt);}
.seq-step-delay{font-size:10px;color:var(--txt3);font-family:'DM Mono',monospace;}

/* ─── Chat triggers ─────────────────────────────── */
.trigger-row{display:flex;align-items:center;gap:4px;padding:5px 7px;border:1px solid var(--brd);
  border-radius:8px;background:var(--bg2);margin-bottom:4px;}
.trigger-kw{font-family:'DM Mono',monospace;font-size:11px;color:var(--acc);flex-shrink:0;}
.trigger-action{font-size:10px;color:var(--txt2);flex:1;}
.trigger-active{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.trigger-active.on{background:#4ade80;}
.trigger-active.off{background:var(--txt3);}

/* ─── Command palette ───────────────────────────── */
#bcim-palette-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:199998;
  display:flex;align-items:flex-start;justify-content:center;padding-top:80px;}
#bcim-palette{width:480px;background:var(--bg);border:1px solid var(--brd);border-radius:14px;overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.8);}
#bcim-palette-input{width:100%;padding:12px 16px;border:none;background:transparent;color:var(--txt);font-size:14px;outline:none;}
#bcim-palette-list{max-height:320px;overflow-y:auto;border-top:1px solid var(--brd);}
.palette-item{padding:9px 14px;cursor:pointer;display:flex;align-items:center;gap:9px;transition:.1s;}
.palette-item:hover,.palette-item.focused{background:color-mix(in srgb,var(--acc) 10%,transparent);}
.palette-icon{font-size:14px;width:22px;text-align:center;flex-shrink:0;}
.palette-label{flex:1;font-size:13px;color:var(--txt);}
.palette-sub{font-size:11px;color:var(--txt2);}
.palette-kbd{font-size:10px;color:var(--txt3);font-family:'DM Mono',monospace;background:var(--bg2);
  border:1px solid var(--brd);border-radius:4px;padding:1px 5px;}

/* ─── Progress bars ─────────────────────────────── */
.prog-bar{background:var(--bg2);border-radius:4px;height:6px;overflow:hidden;margin-top:4px;}
.prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .3s;}
.win-row{display:flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid var(--brd);
  border-radius:8px;background:var(--bg2);margin-bottom:4px;}
.win-pts{font-family:'DM Mono',monospace;font-size:12px;color:var(--acc);font-weight:700;min-width:36px;}
.win-label{flex:1;font-size:11px;color:var(--txt);}

/* ─── Color palette ─────────────────────────────── */
.pal-row{display:flex;gap:3px;align-items:center;flex-wrap:wrap;}
.pal-swatch{width:20px;height:20px;border-radius:4px;border:1px solid var(--brd);cursor:pointer;transition:.15s;}
.pal-swatch:hover{transform:scale(1.2);}

/* ─── Scrollbars ────────────────────────────────── */
#bcim-root ::-webkit-scrollbar{width:3px;}
#bcim-root ::-webkit-scrollbar-thumb{background:var(--brd);border-radius:3px;}
`;
};
