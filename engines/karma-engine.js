// ── BCIM / engines / karma-engine.js ─────────────────────
window.BCIM = window.BCIM || {};

// Default karma config
BCIM.KARMA_DEFAULTS = {
  enabled: true,
  // Points per 5 minutes per item group (key = assetName or group)
  // Format: { key: pts, ... }  where key is assetName (preferred) or group
  pointRules: [
    {id:'r1', label:'Ballgag',    key:'BallGag',    type:'asset', pts:1,  per:5},
    {id:'r2', label:'Doldogag',   key:'DildoGag',   type:'asset', pts:5,  per:5},
    {id:'r3', label:'Armbinder',  key:'ArmBinder',  type:'asset', pts:2,  per:5},
    {id:'r4', label:'Straitjacket',key:'Straitjacket',type:'asset',pts:3, per:5},
    {id:'r5', label:'Handschellen',key:'ItemArms',  type:'group', pts:1,  per:5},
    {id:'r6', label:'Fußfesseln', key:'ItemLegs',   type:'group', pts:1,  per:5},
    {id:'r7', label:'Käfig',      key:'PetCage',    type:'asset', pts:8,  per:5},
  ],
  // Combos: wearing ALL listed items at once multiplies points
  combos: [
    {id:'c1', label:'Vollbindung',  items:['ItemArms','ItemLegs','ItemMouth'],  multiplier:2,   bonus:5,  description:'Alle drei Hauptfesseln'},
    {id:'c2', label:'Stumm & Blind',items:['ItemMouth','ItemEyes'],             multiplier:1.5, bonus:3,  description:'Knebel und Augenbinde'},
    {id:'c3', label:'Total Control',items:['ItemArms','ItemLegs','ItemMouth','ItemEyes','ItemHead'], multiplier:3, bonus:10, description:'Vollständig gefesselt'},
  ],
  // Win / redeem conditions
  winConditions: [
    {id:'w1', pts:50,  label:'Freiheit Arme',  type:'unlock',  group:'ItemArms',  description:'Löst Arme frei'},
    {id:'w2', pts:100, label:'Freiheit Mund',   type:'unlock',  group:'ItemMouth', description:'Löst Knebel'},
    {id:'w3', pts:200, label:'Vollständige Freiheit', type:'freeAll', description:'Alle Items werden entfernt'},
    {id:'w4', pts:30,  label:'Armbinder 5 Min bei Spieler X', type:'applyTo', group:'ItemArms', assetName:'ArmBinder', targetMode:'char', durationMinutes:5, description:'Legt Armbinder an Spieler X für 5 Minuten an'},
    {id:'w5', pts:20,  label:'Gambling: 2x Einsatz',  type:'gamblingBoost', multiplier:2, description:'Verdoppelt nächsten Gambling-Gewinn'},
  ],
  // Gambling integration
  gambling: {
    enabled: true,
    minBet: 10,
    maxBet: 500,
  },
  // Intervals
  tickIntervalSeconds: 60,  // check every 60s
  ticksPerPoint: 5,         // accumulate for 5 ticks (= per 5 min) before awarding
};

BCIM.KARMA = {
  _interval:   null,
  _ticks:      {},    // assetName/group -> tick count
  _combosActive: [],
  _gamblingBoost: 1,

  // ── Lifecycle ────────────────────────────────────────────
  start: () => {
    BCIM.KARMA.stop();
    const cfg = BCIM.KARMA.getCfg();
    if (!cfg.enabled) return;
    const ms = (cfg.tickIntervalSeconds||60)*1000;
    BCIM.KARMA._interval = setInterval(BCIM.KARMA._tick, ms);
    BCIM.emit('karmaStart',{});
  },

  stop: () => {
    clearInterval(BCIM.KARMA._interval);
    BCIM.KARMA._interval = null;
    BCIM.emit('karmaStop',{});
  },

  active: () => !!BCIM.KARMA._interval,

  // ── Config ───────────────────────────────────────────────
  getCfg: () => BCIM.CFG.karmaConfig || {...BCIM.KARMA_DEFAULTS},
  saveCfg: (cfg) => { BCIM.CFG.karmaConfig = cfg; BCIM.saveCFG(); },
  resetToDefaults: () => { BCIM.CFG.karmaConfig = {...BCIM.KARMA_DEFAULTS}; BCIM.saveCFG(); },

  // ── Points ───────────────────────────────────────────────
  getPoints: () => BCIM.DB.get('karmaPoints', 0),
  addPoints: (pts, reason) => {
    const cur = BCIM.KARMA.getPoints();
    const next = cur + pts;
    BCIM.DB.set('karmaPoints', next);
    BCIM.DB.push('karmaLog', {timestamp:Date.now(), pts, reason, total:next}, 500);
    BCIM.emit('karmaPointsChanged', {from:cur, to:next, pts, reason});
    BCIM.KARMA._checkWinConditions(next, cur);
    return next;
  },
  spendPoints: (pts, reason) => {
    const cur = BCIM.KARMA.getPoints();
    if (cur < pts) return false;
    BCIM.DB.set('karmaPoints', cur - pts);
    BCIM.DB.push('karmaLog', {timestamp:Date.now(), pts:-pts, reason, total:cur-pts}, 500);
    BCIM.emit('karmaPointsChanged', {from:cur, to:cur-pts, pts:-pts, reason});
    return true;
  },
  resetPoints: () => { BCIM.DB.set('karmaPoints',0); BCIM.DB.set('karmaLog',[]); },

  // ── Tick logic ───────────────────────────────────────────
  _tick: () => {
    const char = BCIM.S.char; if(!char) return;
    const cfg = BCIM.KARMA.getCfg();
    const snap = BCIM.BC.snapshot(char);
    let earned = 0;
    const reasons = [];

    // Check point rules
    cfg.pointRules?.forEach(rule => {
      const wearing = rule.type==='asset'
        ? snap.find(s=>s.assetName===rule.key)
        : snap.find(s=>s.group===rule.key);
      if (!wearing) { BCIM.KARMA._ticks[rule.id]=0; return; }

      BCIM.KARMA._ticks[rule.id] = (BCIM.KARMA._ticks[rule.id]||0)+1;
      const per = rule.per||5;
      if (BCIM.KARMA._ticks[rule.id] >= per) {
        BCIM.KARMA._ticks[rule.id] = 0;
        earned += rule.pts||1;
        reasons.push(`${rule.label}: +${rule.pts}`);
      }
    });

    // Check combos
    const activeComboLabels = [];
    let comboBonus = 0;
    let comboMultiplier = 1;
    cfg.combos?.forEach(combo => {
      const allWorn = combo.items.every(key =>
        snap.find(s=>s.group===key||s.assetName===key)
      );
      if (allWorn) {
        activeComboLabels.push(combo.label);
        comboBonus += combo.bonus||0;
        comboMultiplier = Math.max(comboMultiplier, combo.multiplier||1);
      }
    });
    BCIM.KARMA._combosActive = activeComboLabels;

    if (earned > 0) {
      const total = Math.round(earned * comboMultiplier) + comboBonus;
      if (comboBonus||comboMultiplier>1) reasons.push(`Kombo-Bonus: ×${comboMultiplier} +${comboBonus}`);
      BCIM.KARMA.addPoints(total, reasons.join(' | '));
    }

    BCIM.emit('karmaTick', {earned, combos:activeComboLabels});
  },

  _checkWinConditions: (newPts, oldPts) => {
    const cfg = BCIM.KARMA.getCfg();
    // Only auto-trigger conditions that cross the threshold
    cfg.winConditions?.forEach(w => {
      if (w.autoTrigger && newPts>=w.pts && oldPts<w.pts) {
        BCIM.KARMA.redeemCondition(w.id);
      }
    });
  },

  // ── Redeem ───────────────────────────────────────────────
  redeemCondition: (winId, targetChar) => {
    const cfg = BCIM.KARMA.getCfg();
    const cond = cfg.winConditions?.find(w=>w.id===winId);
    if (!cond) return {ok:false,reason:'Nicht gefunden'};
    if (BCIM.KARMA.getPoints() < cond.pts) return {ok:false,reason:'Nicht genug Punkte'};

    const char = BCIM.S.char; if(!char) return {ok:false,reason:'Kein Spieler'};
    const target = targetChar||char;

    switch(cond.type) {
      case 'unlock': BCIM.BC.removeItem(char, cond.group); break;
      case 'freeAll': {
        const groups = BCIM.BC.getGroups(char.AssetFamily||'Female3DCG');
        groups.forEach(g=>BCIM.BC.removeItem(char,g.Name));
        break;
      }
      case 'applyTo': {
        const fam = target.AssetFamily||'Female3DCG';
        const asset = BCIM.BC.getAssetsForGroup(fam,cond.group).find(a=>a.Name===cond.assetName);
        if (asset) {
          BCIM.BC.applyItem(target, cond.group, asset, undefined, undefined, undefined);
          if (cond.durationMinutes) {
            setTimeout(()=>BCIM.BC.removeItem(target,cond.group), cond.durationMinutes*60000);
          }
        }
        break;
      }
      case 'gamblingBoost': {
        BCIM.KARMA._gamblingBoost = cond.multiplier||2;
        setTimeout(()=>{BCIM.KARMA._gamblingBoost=1;},300000); // 5 min window
        break;
      }
    }

    BCIM.KARMA.spendPoints(cond.pts, `Eingelöst: ${cond.label}`);
    BCIM.BC.sendChat(`✨ Karma eingelöst: ${cond.label}`);
    BCIM.emit('karmaRedeemed',{cond,char:target});
    return {ok:true};
  },

  // ── Gambling ─────────────────────────────────────────────
  gamble: (betPts, mode) => {
    const cfg = BCIM.KARMA.getCfg();
    const gcfg = cfg.gambling||{};
    if (!gcfg.enabled) return {ok:false,reason:'Gambling deaktiviert'};
    if (betPts < (gcfg.minBet||10)) return {ok:false,reason:`Mindest-Einsatz: ${gcfg.minBet}`};
    if (betPts > (gcfg.maxBet||500)) return {ok:false,reason:`Maximum-Einsatz: ${gcfg.maxBet}`};
    if (!BCIM.KARMA.spendPoints(betPts,'Gambling-Einsatz')) return {ok:false,reason:'Nicht genug Punkte'};

    let result, winPts=0, msgResult='';
    const boost = BCIM.KARMA._gamblingBoost;

    if (mode==='coinflip') {
      result = Math.random()<0.5?'win':'lose';
      if (result==='win') { winPts=Math.round(betPts*2*boost); msgResult=`Gewonnen! +${winPts} Karma`; }
      else msgResult='Verloren!';
    } else if (mode==='dice') {
      const roll = Math.floor(Math.random()*6)+1;
      const mult = [0,0,0.5,1,1.5,2,3][roll]; // 1,2=lose, 3=half, 4=break even, 5=1.5x, 6=3x
      winPts = Math.round(betPts*mult*boost);
      msgResult = `Würfel: ${roll} → ${winPts>0?`+${winPts} Karma`:'Verloren'}`;
      result = roll;
    } else if (mode==='roulette') {
      const num = Math.floor(Math.random()*37); // 0-36
      const isRed=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
      winPts = num===0 ? 0 : Math.round(betPts*2*boost);
      msgResult = `Roulette: ${num} ${num===0?'(0)':(isRed?'🔴':'⚫')} → ${winPts>0?`+${winPts}`:'Verloren'}`;
      result = {num,isRed};
    }

    if (winPts>0) BCIM.KARMA.addPoints(winPts,`Gambling-Gewinn (${mode})`);
    const net = winPts - betPts;
    BCIM.DB.push('gamblingLog',{timestamp:Date.now(),mode,bet:betPts,won:winPts,net,result},100);
    BCIM.emit('gambleDone',{mode,bet:betPts,winPts,net,msgResult,result});
    return {ok:true,winPts,net,msgResult,result};
  },

  getGamblingStats: () => {
    const log = BCIM.DB.get('gamblingLog',[]);
    const totalBet = log.reduce((s,e)=>s+e.bet,0);
    const totalWon = log.reduce((s,e)=>s+e.won,0);
    return {games:log.length, totalBet, totalWon, net:totalWon-totalBet};
  },

  // ── Leaderboard (session-local, no server) ───────────────
  addToLeaderboard: (name, pts) => {
    const lb = BCIM.DB.get('karmaLeaderboard',[]);
    const idx = lb.findIndex(e=>e.name===name);
    if (idx>=0) lb[idx].pts=pts; else lb.push({name,pts});
    lb.sort((a,b)=>b.pts-a.pts);
    if(lb.length>20) lb.length=20;
    BCIM.DB.set('karmaLeaderboard',lb);
  },
  getLeaderboard: () => BCIM.DB.get('karmaLeaderboard',[]),
};
