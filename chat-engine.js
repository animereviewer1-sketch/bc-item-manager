// ── BCIM / chat-engine.js (v3.1 fixed) ───────────────────
window.BCIM = window.BCIM || {};

BCIM.CHAT = {
  _active: false,
  _hookHandle: null,
  _origFn: null,

  // ── Start ─────────────────────────────────────────────
  start: () => {
    if (BCIM.CHAT._active) return;
    BCIM.CHAT._active = true;

    // Method 1: Hook via ModSDK (preferred – cleanest)
    try {
      const sdk = window.bcModSDK || window.ModSDK;
      if (sdk?.hookFunction) {
        BCIM.CHAT._hookHandle = sdk.hookFunction('ChatRoomMessage', 0, (args, next) => {
          next(args);
          try { BCIM.CHAT._onMessage(args[0]); } catch {}
        });
        console.log('[BCIM Chat] Hooked via ModSDK');
        BCIM.emit('chatEngineStart',{method:'modsdk'});
        return;
      }
    } catch {}

    // Method 2: Override global ChatRoomMessage function
    try {
      if (typeof ChatRoomMessage === 'function') {
        BCIM.CHAT._origFn = window.ChatRoomMessage;
        window.ChatRoomMessage = function(data) {
          try { BCIM.CHAT._origFn.call(this, data); } catch {}
          try { BCIM.CHAT._onMessage(data); } catch {}
        };
        console.log('[BCIM Chat] Hooked via function override');
        BCIM.emit('chatEngineStart',{method:'override'});
        return;
      }
    } catch {}

    // Method 3: Hook ServerSocket directly
    try {
      if (window.ServerSocket && typeof ServerSocket.on === 'function') {
        const handler = (data) => { try { BCIM.CHAT._onMessage(data); } catch {} };
        ServerSocket.on('ChatRoomMessage', handler);
        BCIM.CHAT._hookHandle = handler;
        BCIM.CHAT._hookMode = 'socket';
        console.log('[BCIM Chat] Hooked via ServerSocket');
        BCIM.emit('chatEngineStart',{method:'socket'});
        return;
      }
    } catch {}

    console.warn('[BCIM Chat] No hook method available');
    BCIM.emit('chatEngineStart',{method:'none'});
  },

  // ── Stop ──────────────────────────────────────────────
  stop: () => {
    if (!BCIM.CHAT._active) return;
    BCIM.CHAT._active = false;

    try {
      const sdk = window.bcModSDK || window.ModSDK;
      if (sdk?.removeHooksByModule) sdk.removeHooksByModule('BCItemManager');
      else if (BCIM.CHAT._hookHandle?.unhook) BCIM.CHAT._hookHandle.unhook();
    } catch {}

    if (BCIM.CHAT._origFn) {
      window.ChatRoomMessage = BCIM.CHAT._origFn;
      BCIM.CHAT._origFn = null;
    }

    if (BCIM.CHAT._hookMode === 'socket' && BCIM.CHAT._hookHandle) {
      try { ServerSocket.off('ChatRoomMessage', BCIM.CHAT._hookHandle); } catch {}
    }

    BCIM.CHAT._hookHandle = null;
    BCIM.CHAT._hookMode = null;
    BCIM.emit('chatEngineStop',{});
  },

  active: () => BCIM.CHAT._active,

  // ── Message handler ───────────────────────────────────
  _onMessage: (data) => {
    if (!data) return;
    // BC message types: Chat, Emote, Whisper, Action
    const type   = data.Type || data.type;
    const text   = (data.Content || data.content || '').toLowerCase().trim();
    const sender  = data.Sender ?? data.sender ?? null;

    // Only process Chat and Emote
    if (type !== 'Chat' && type !== 'Emote') return;
    if (!text) return;

    const senderChar = sender != null ? BCIM.BC.player(sender) : null;

    // ── Keyword triggers ─────────────────────────────────
    const triggers = BCIM.CFG.chatTriggers || [];
    triggers.filter(t=>t.active).forEach(trigger => {
      const kw = (trigger.keyword||'').toLowerCase().trim();
      if (!kw) return;
      const match = trigger.matchMode==='exact' ? text===kw : text.includes(kw);
      if (!match) return;

      // Sender filter
      if (trigger.senderFilter==='whitelist') {
        const wl = BCIM.CFG.chatWhitelist||[];
        if (!wl.includes(sender)) return;
      }
      if (trigger.senderFilter==='self' && !senderChar?.IsPlayer?.()) return;

      BCIM.CHAT._executeTrigger(trigger, senderChar);
    });

    // ── Commands (!bcim or !bc) ───────────────────────────
    if (text.startsWith('!bcim ') || text.startsWith('!bc ')) {
      const parts = text.split(' ');
      const args  = parts.slice(1);
      BCIM.CHAT._handleCommand(args, senderChar, sender);
    }
  },

  _executeTrigger: (trigger, senderChar) => {
    const char   = BCIM.S.char;
    if (!char) return;
    const target = trigger.targetSelf ? Player : (senderChar || Player);
    const actions = trigger.actions || [];
    let delay = 0;
    actions.forEach(action => {
      setTimeout(()=>{ try { BCIM.CHAT._executeAction(action, target, char, senderChar); } catch {} }, delay);
      delay += (action.delay||0);
    });
    BCIM.DB.push('chatLog',{timestamp:Date.now(),type:'trigger',keyword:trigger.keyword,
      sender:senderChar?.Name,actions:actions.length},100);
    BCIM.emit('chatTriggerFired',{trigger,sender:senderChar});
  },

  _executeAction: (action, target, self, sender) => {
    const fam = target.AssetFamily||'Female3DCG';
    switch(action.type) {
      case 'applyItem': {
        const assets=BCIM.BC.getAssetsForGroup(fam, action.group);
        const asset=assets.find(a=>a.Name===action.assetName)||(action.random?assets[Math.floor(Math.random()*assets.length)]:null);
        if (asset) BCIM.BC.applyItem(target, action.group, asset, action.colors, action.craft, action.property);
        break;
      }
      case 'removeItem': BCIM.BC.removeItem(target, action.group); break;
      case 'applyOutfit': {
        const outfit=(BCIM.DB.get('outfits',[])).find(o=>o.name===action.outfitName||o.id===action.outfitId);
        if (outfit) BCIM.BC.applySnapshot(target, outfit.items);
        break;
      }
      case 'sendChat': {
        let msg=(action.message||'').replace('{sender}',sender?.Name||'?').replace('{self}',self?.Name||'?');
        BCIM.BC.sendChat(msg);
        break;
      }
      case 'sendEmote': {
        let msg=(action.message||'').replace('{sender}',sender?.Name||'?');
        BCIM.BC.sendEmote(msg);
        break;
      }
      case 'randomRestraints': BCIM.AUTO.randomRestraints(target, action.config||{slots:['ItemArms'],chatAnnounce:true}); break;
      case 'macro': {
        const macro=(BCIM.DB.get('macros',[])).find(m=>m.name===action.macroName);
        if (macro) BCIM.AUTO.playMacro(target, macro, null, null);
        break;
      }
    }
  },

  _handleCommand: (args, senderChar, senderNumber) => {
    const wl = BCIM.CFG.chatWhitelist||[];
    if (!wl.includes(senderNumber) && !senderChar?.IsPlayer?.()) return;
    const char = BCIM.S.char; if (!char) return;
    const cmd  = args[0];
    const cmds = BCIM.CFG.chatCommands||[];
    const cmdCfg = cmds.find(c=>c.command===cmd&&c.active);
    if (!cmdCfg) return;
    try { BCIM.CHAT._executeAction({type:cmdCfg.actionType,...cmdCfg.actionParams}, char, char, senderChar); } catch {}
    if (cmdCfg.announceExecution)
      BCIM.BC.sendChat(cmdCfg.announceMessage||`Command ${cmd} ausgeführt.`);
    BCIM.emit('chatCommandFired',{cmd,sender:senderChar});
  },

  // ── Whitelist ─────────────────────────────────────────
  addToWhitelist: (memberNumber) => {
    const wl=BCIM.CFG.chatWhitelist||[];
    if(!wl.includes(memberNumber)){wl.push(memberNumber);BCIM.CFG.chatWhitelist=wl;BCIM.saveCFG();}
  },
  removeFromWhitelist: (memberNumber) => {
    BCIM.CFG.chatWhitelist=(BCIM.CFG.chatWhitelist||[]).filter(n=>n!==memberNumber); BCIM.saveCFG();
  },
  isWhitelisted: (n) => (BCIM.CFG.chatWhitelist||[]).includes(n),

  // ── CRUD ──────────────────────────────────────────────
  saveTrigger: (trigger) => {
    const arr=BCIM.CFG.chatTriggers||[];
    const i=arr.findIndex(t=>t.id===trigger.id);
    if(i>=0) arr[i]=trigger; else arr.push({...trigger,id:Date.now()});
    BCIM.CFG.chatTriggers=arr; BCIM.saveCFG();
  },
  deleteTrigger: (id) => { BCIM.CFG.chatTriggers=(BCIM.CFG.chatTriggers||[]).filter(t=>t.id!==id); BCIM.saveCFG(); },
  saveCommand: (cmd) => {
    const arr=BCIM.CFG.chatCommands||[];
    const i=arr.findIndex(c=>c.id===cmd.id);
    if(i>=0) arr[i]=cmd; else arr.push({...cmd,id:Date.now()});
    BCIM.CFG.chatCommands=arr; BCIM.saveCFG();
  },
  deleteCommand: (id) => { BCIM.CFG.chatCommands=(BCIM.CFG.chatCommands||[]).filter(c=>c.id!==id); BCIM.saveCFG(); },
};
