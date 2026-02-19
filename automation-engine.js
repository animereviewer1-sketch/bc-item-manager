// ── BCIM / engines / automation-engine.js ─────────────────
window.BCIM = window.BCIM || {};

BCIM.AUTO = {
  // ── Sequence executor ────────────────────────────────────
  // steps: [{group, assetName, craft, property, colors, action:'apply'|'remove', delay:ms}]
  runSequence: async (char, steps, onStep, onDone) => {
    if (BCIM.S.sequenceRunning) return;
    BCIM.S.sequenceRunning = true;
    BCIM.emit('sequenceStart', steps);
    for (let i = 0; i < steps.length; i++) {
      if (!BCIM.S.sequenceRunning) break;
      const step = steps[i];
      onStep?.(i, step);
      try {
        if (step.action === 'remove') {
          BCIM.BC.removeItem(char, step.group);
        } else {
          const fam = char.AssetFamily||'Female3DCG';
          const asset = BCIM.BC.getAssetsForGroup(fam, step.group).find(a=>a.Name===step.assetName);
          if (asset) BCIM.BC.applyItem(char, step.group, asset, step.colors, step.craft, step.property);
        }
        const msg = step.chatMsg;
        if (msg) BCIM.BC.sendChat(msg);
      } catch(e) { console.warn('[BCIM AUTO]', e); }

      const delay = step.delay ?? BCIM.CFG.sequenceDelay ?? 1000;
      if (i < steps.length - 1) await BCIM.AUTO._sleep(delay);
    }
    BCIM.S.sequenceRunning = false;
    onDone?.();
    BCIM.emit('sequenceDone', {});
  },

  stopSequence: () => { BCIM.S.sequenceRunning = false; BCIM.emit('sequenceStopped',{}); },

  // ── Random restraint generator ────────────────────────────
  // config: { slots:['ItemArms','ItemMouth',...], difficulty:0-20, craftProperty:'Shiny'|null, chatAnnounce:bool }
  randomRestraints: (char, config) => {
    if (!char) return;
    const fam = char.AssetFamily||'Female3DCG';
    const applied = [];
    (config.slots||[]).forEach(group => {
      const assets = BCIM.BC.getAssetsForGroup(fam, group);
      if (!assets.length) return;
      const asset = assets[Math.floor(Math.random()*assets.length)];
      const prop = config.difficulty!=null ? {Difficulty:config.difficulty} : undefined;
      const craft = config.craftProperty ? {Property:config.craftProperty} : undefined;
      BCIM.BC.applyItem(char, group, asset, undefined, craft, prop);
      applied.push({group, assetName:asset.Name});
    });
    if (config.chatAnnounce && applied.length) {
      const names = applied.map(a=>(a.assetName||'').replace(/([A-Z])/g,' $1').trim()).join(', ');
      BCIM.BC.sendEmote(`bekommt zufällig angelegt: ${names}`);
    }
    BCIM.emit('randomApplied', applied);
    return applied;
  },

  // ── Escalation mode ──────────────────────────────────────
  // config: { items:[{group,assetName,craft,property},...], intervalMinutes:5, chatAnnounce:bool, loop:bool }
  startEscalation: (char, config, onStep) => {
    BCIM.AUTO.stopEscalation();
    let idx = 0;
    const items = config.items||[];
    if (!items.length) return;

    const applyNext = () => {
      if (idx >= items.length) {
        if (config.loop) idx = 0; else { BCIM.AUTO.stopEscalation(); return; }
      }
      const entry = items[idx++];
      const fam = char.AssetFamily||'Female3DCG';
      const asset = BCIM.BC.getAssetsForGroup(fam, entry.group).find(a=>a.Name===entry.assetName);
      if (asset) {
        BCIM.BC.applyItem(char, entry.group, asset, entry.colors, entry.craft, entry.property);
        onStep?.(entry, idx);
        if (config.chatAnnounce) {
          const name = (entry.assetName||'').replace(/([A-Z])/g,' $1').trim();
          BCIM.BC.sendEmote(`bekommt ein weiteres Item angelegt: ${name}`);
        }
      }
    };

    applyNext(); // apply first immediately
    const ms = (config.intervalMinutes||5)*60000;
    BCIM.S.escalationInterval = setInterval(applyNext, ms);
    BCIM.DB.set('escalationState',{active:true,idx,config});
    BCIM.emit('escalationStart', config);
  },

  stopEscalation: () => {
    clearInterval(BCIM.S.escalationInterval);
    BCIM.S.escalationInterval = null;
    BCIM.DB.del('escalationState');
    BCIM.emit('escalationStop',{});
  },

  escalationActive: () => !!BCIM.S.escalationInterval,

  // ── Auto-escape ──────────────────────────────────────────
  // config: { condition:'always'|'alone'|'timer'|'items', timerMinutes, allowedItems:[], intervalSeconds:30 }
  startAutoEscape: (char, config, onEscape) => {
    BCIM.AUTO.stopAutoEscape();
    const interval = (config.intervalSeconds||30)*1000;
    BCIM.S.escapeInterval = setInterval(() => {
      if (!BCIM.AUTO._checkEscapeCondition(char, config)) return;
      const groups = BCIM.BC.getGroups(char.AssetFamily||'Female3DCG');
      groups.forEach(g => {
        const item = BCIM.BC.getItem(char, g.Name);
        if (!item) return;
        // Skip if item is in allowed list
        if (config.allowedItems?.includes(item.Asset?.Name)) return;
        const ok = BCIM.BC.tryEscape(char, g.Name);
        if (ok) {
          onEscape?.(g.Name, item.Asset?.Name);
          BCIM.emit('escaped',{group:g.Name,assetName:item.Asset?.Name});
        }
      });
    }, interval);
    BCIM.emit('autoEscapeStart', config);
  },

  stopAutoEscape: () => {
    clearInterval(BCIM.S.escapeInterval);
    BCIM.S.escapeInterval = null;
    BCIM.emit('autoEscapeStop',{});
  },

  autoEscapeActive: () => !!BCIM.S.escapeInterval,

  _checkEscapeCondition: (char, config) => {
    if (config.condition === 'always') return true;
    if (config.condition === 'alone') {
      const others = BCIM.BC.players().filter(c=>!c.IsPlayer?.());
      return others.length === 0;
    }
    if (config.condition === 'timer') {
      // check if any item has been worn for > timerMinutes
      const state = BCIM.SYNC._diaryActive||{};
      const now = Date.now();
      return Object.values(state).some(e=>(now-e.startTime)>=(config.timerMinutes||10)*60000);
    }
    if (config.condition === 'items') {
      // only escape items NOT in allowedItems
      return true;
    }
    return false;
  },

  // ── Macro recorder ───────────────────────────────────────
  startRecording: () => {
    BCIM.S.macroRecording = true;
    BCIM.S.macroLog = [];
    BCIM.S._macroStartTime = Date.now();
    // Hook into apply/remove events
    BCIM.on('itemApplied', BCIM.AUTO._macroHookApply);
    BCIM.on('itemRemoved', BCIM.AUTO._macroHookRemove);
    BCIM.emit('macroRecordStart',{});
  },

  stopRecording: (saveName) => {
    BCIM.S.macroRecording = false;
    BCIM.S._macroListeners = null;
    const log = BCIM.S.macroLog;
    if (saveName && log.length) {
      const macros = BCIM.DB.get('macros',[]);
      macros.unshift({id:Date.now(), name:saveName, steps:log, createdAt:Date.now()});
      BCIM.DB.set('macros',macros);
    }
    BCIM.emit('macroRecordStop',{steps:log});
    return log;
  },

  _macroHookApply: ({char,group,asset,colors,craft,property}) => {
    if (!BCIM.S.macroRecording) return;
    const delay = BCIM.S.macroLog.length
      ? Date.now() - BCIM.S._macroLastTime
      : 0;
    BCIM.S._macroLastTime = Date.now();
    BCIM.S.macroLog.push({action:'apply',group,assetName:asset?.Name,colors,craft,property,delay});
  },

  _macroHookRemove: ({char,group}) => {
    if (!BCIM.S.macroRecording) return;
    const delay = BCIM.S.macroLog.length ? Date.now()-BCIM.S._macroLastTime : 0;
    BCIM.S._macroLastTime = Date.now();
    BCIM.S.macroLog.push({action:'remove',group,delay});
  },

  playMacro: (char, macro, onStep, onDone) => {
    BCIM.AUTO.runSequence(char, macro.steps, onStep, onDone);
  },

  _sleep: (ms) => new Promise(r=>setTimeout(r,ms)),
};
