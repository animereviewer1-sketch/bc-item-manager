// ── BCIM / core / sync.js ─────────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.SYNC = {
  _diaryActive: {},   // group -> { assetName, startTime, points }
  _lastSnap:    [],

  saveHistory: (char) => {
    if (!char) return;
    const snap = BCIM.BC.snapshot(char);
    BCIM.DB.push('history',{timestamp:Date.now(),charName:char.Name,items:snap},10);
    BCIM.SYNC._updateDiary(snap);
  },

  logAction: (action, group, assetName, charName) => {
    BCIM.DB.push('session',{timestamp:Date.now(),action,group,assetName,charName},300);
  },

  _updateDiary: (snap) => {
    const now = Date.now();
    // Close removed entries
    Object.keys(BCIM.SYNC._diaryActive).forEach(group => {
      if (!snap.find(s=>s.group===group)) {
        const entry = BCIM.SYNC._diaryActive[group];
        const diary = BCIM.DB.get('diary',[]);
        diary.unshift({
          date:    new Date(entry.startTime).toISOString().slice(0,10),
          group, assetName: entry.assetName,
          startTime: entry.startTime, endTime: now,
          duration: now - entry.startTime,
        });
        if (diary.length>500) diary.length=500;
        BCIM.DB.set('diary',diary);
        delete BCIM.SYNC._diaryActive[group];
        // emit for karma engine
        BCIM.emit('itemWorn', {group, assetName:entry.assetName, duration:now-entry.startTime});
      }
    });
    // Open new entries
    snap.forEach(s => {
      if (!BCIM.SYNC._diaryActive[s.group])
        BCIM.SYNC._diaryActive[s.group] = {assetName:s.assetName, startTime:now};
    });
  },

  startMonitor: (char) => {
    if (!char) return;
    BCIM.SYNC._lastSnap = BCIM.BC.snapshot(char);
    BCIM.SYNC._diaryActive = {};
    BCIM.SYNC._lastSnap.forEach(s => {
      BCIM.SYNC._diaryActive[s.group] = {assetName:s.assetName, startTime:Date.now()};
    });
  },

  checkChanges: (char) => {
    if (!char) return [];
    const now = BCIM.BC.snapshot(char);
    const changes = [];
    BCIM.SYNC._lastSnap.forEach(old => {
      if (!now.find(n=>n.group===old.group))
        changes.push({type:'removed',group:old.group,assetName:old.assetName});
    });
    now.forEach(n => {
      const old = BCIM.SYNC._lastSnap.find(o=>o.group===n.group);
      if (!old)                            changes.push({type:'added',   group:n.group,assetName:n.assetName});
      else if (old.assetName!==n.assetName) changes.push({type:'changed', group:n.group,from:old.assetName,to:n.assetName});
      else if (JSON.stringify(old.property)!==JSON.stringify(n.property))
                                           changes.push({type:'property',group:n.group,assetName:n.assetName});
    });
    if (changes.length) {
      BCIM.SYNC._lastSnap = now;
      BCIM.SYNC._updateDiary(now);
      BCIM.emit('snapChanged', changes);
    }
    return changes;
  },

  formatDuration: (ms) => {
    if (!ms||ms<0) return '0s';
    const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
    if(h>0) return `${h}h ${m}m`;
    if(m>0) return `${m}m ${s}s`;
    return `${s}s`;
  },

  getOutfitDiff: (current, target) => {
    const diffs=[];
    target.forEach(t=>{
      const c=current.find(x=>x.group===t.group);
      if(!c)                          diffs.push({type:'added',  group:t.group,assetName:t.assetName});
      else if(c.assetName!==t.assetName) diffs.push({type:'changed',group:t.group,from:c.assetName,to:t.assetName});
    });
    current.forEach(c=>{
      if(!target.find(t=>t.group===c.group)) diffs.push({type:'removed',group:c.group,assetName:c.assetName});
    });
    return diffs;
  },
};
