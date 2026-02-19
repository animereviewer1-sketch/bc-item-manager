// ── BCIM / core / storage.js ──────────────────────────────
window.BCIM = window.BCIM || {};
BCIM.DB = {
  get:  (k, d=null)      => { try { const v=localStorage.getItem('bcim:'+k); return v!=null?JSON.parse(v):d; } catch { return d; } },
  set:  (k, v)           => { try { localStorage.setItem('bcim:'+k, JSON.stringify(v)); } catch {} },
  del:  (k)              => { try { localStorage.removeItem('bcim:'+k); } catch {} },
  push: (k, item, max=200) => { const a=BCIM.DB.get(k,[]); a.unshift(item); if(a.length>max) a.length=max; BCIM.DB.set(k,a); return a; },
  keys: (prefix='')      => { try { return Object.keys(localStorage).filter(k=>k.startsWith('bcim:'+prefix)).map(k=>k.slice(5)); } catch { return []; } },
  clear: (prefix='')     => { BCIM.DB.keys(prefix).forEach(k=>BCIM.DB.del(k)); },
};
