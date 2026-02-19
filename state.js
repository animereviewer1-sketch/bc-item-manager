// ── BCIM / core / state.js ────────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.CFG = BCIM.DB.get('settings', {
  theme:            'dark',    // dark | purple | pink
  opacity:          1,
  miniMode:         false,
  ownerSlots:       [],
  masterColorGroup: null,
  favorites:        [],
  colorPalettes:    [],
  karmaConfig:      null,      // loaded by karma engine
  chatTriggers:     [],        // loaded by chat engine
  chatCommands:     [],
  sequenceDelay:    1000,      // ms between sequence steps
  escapeConfig: {
    enabled: false,
    condition: 'always',       // always | alone | timer | items
    timerMinutes: 10,
    allowedItems: [],
  },
});
BCIM.saveCFG = () => BCIM.DB.set('settings', BCIM.CFG);

BCIM.S = {
  // item configurator
  char:          null,
  group:         null,
  asset:         null,
  craft:         {},
  prop:          {},
  colors:        [],
  modSelections: {},
  typedType:     null,
  // ui
  tab:           'slots',
  searchQ:       '',
  // monitor
  monitorAlerts: [],
  ownerAlerts:   [],
  monitorSnap:   null,
  // automation
  sequenceRunning: false,
  escapeInterval:  null,
  escalationInterval: null,
  macroRecording:  false,
  macroLog:        [],
  // karma
  karmaSession: { points: 0, combos: [], log: [] },
};

BCIM.resetItem = () => {
  BCIM.S.craft = {}; BCIM.S.prop = {}; BCIM.S.colors = [];
  BCIM.S.modSelections = {}; BCIM.S.typedType = null;
};

// status helper (set from layout after DOM ready)
BCIM.setStatus = (msg, type='ok') => {
  const el = document.getElementById('bcim-st');
  if (!el) return;
  el.textContent = msg;
  el.className = `st-${type}`;
  clearTimeout(BCIM._stTimer);
  BCIM._stTimer = setTimeout(() => { if(el){el.textContent='';el.className='';} }, 3500);
};

// event bus (lightweight)
BCIM._listeners = {};
BCIM.on  = (ev, fn) => { (BCIM._listeners[ev] = BCIM._listeners[ev]||[]).push(fn); };
BCIM.emit = (ev, data) => { (BCIM._listeners[ev]||[]).forEach(fn=>fn(data)); };
