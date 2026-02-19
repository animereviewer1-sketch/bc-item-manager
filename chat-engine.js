// ── BCIM / engines / chat-engine.js ──────────────────────
window.BCIM = window.BCIM || {};

BCIM.CHAT = {
  _active: false,
  _origChatReceive: null,

  // ── Start / Stop ─────────────────────────────────────────
  start: () => {
    if (BCIM.CHAT._active) return;
    BCIM.CHAT._active = true;
    // Hook into BC's ChatRoomMessage handler
    try {
      if (typeof ChatRoomMessage === 'function') {
        BCIM.CHAT._origChatReceive = ChatRoomMessage;
        window.ChatRoomMessage = (data) => {
          BCIM.CHAT._origChatReceive(data);
          BCIM.CHAT._onMessage(data);
        };
      }
    } catch(e) { console.warn('[BCIM CHAT] Hook failed',e); }
    BCIM.emit('chatEngineStart',{});
  },

  stop: () => {
    if (!BCIM.CHAT._active) return;
    BCIM.CHAT._active = false;
    if (BCIM.CHAT._origChatReceive) {
      window.ChatRoomMessage = BCIM.CHAT._origChatReceive;
      BCIM.CHAT._origChatReceive = null;
    }
    BCIM.emit('chatEngineStop',{});
  },

  active: () => BCIM.CHAT._active,

  // ── Message handler ──────────────────────────────────────
  _onMessage: (data) => {
    if (!data || data.Type !== 'Chat') return;
    const text    = (data.Content||'').toLowerCase().trim();
    const sender  = data.Sender; // member number
    const senderChar = BCIM.BC.player(sender);

    // ── Keyword triggers ─────────────────────────────────
    const triggers = BCIM.CFG.chatTriggers||[];
    triggers.filter(t=>t.active).forEach(trigger => {
      const kw = (trigger.keyword||'').toLowerCase().trim();
      if (!kw) return;
      const match = trigger.matchMode==='exact' ? text===kw : text.includes(kw);
      if (!match) return;
      // Check sender filter
      if (trigger.senderFilter==='whitelist') {
        const wl = (BCIM.CFG.chatWhitelist||[]);
        if (!wl.includes(sender)) return;
      }
      if (trigger.senderFilter==='self' && !senderChar?.IsPlayer?.()) return;
      BCIM.CHAT._executeTrigger(trigger, senderChar);
    });

    // ── Commands (start with !) ───────────────────────────
    if (text.startsWith('!bcim ') || text.startsWith('!bc ')) {
      const args = text.split(' ').slice(1);
      BCIM.CHAT._handleCommand(args, senderChar, sender);
    }
  },

  _executeTrigger: (trigger, senderChar) => {
    const char = BCIM.S.char;
    if (!char) return;
    const target = trigger.targetSelf ? Player : (senderChar||Player);

    // Execute each action in the trigger
    const actions = trigger.actions||[];
    let delay = 0;
    actions.forEach((action, i) => {
      setTimeout(() => {
        BCIM.CHAT._executeAction(action, target, char, senderChar);
      }, delay);
      delay += (action.delay||0);
    });

    // Log
    BCIM.DB.push('chatLog',{timestamp:Date.now(),type:'trigger',keyword:trigger.keyword,
      sender:senderChar?.Name,actions:actions.length},100);
    BCIM.emit('chatTriggerFired',{trigger,sender:senderChar});
  },

  _executeAction: (action, target, self, sender) => {
    const fam = target.AssetFamily||'Female3DCG';
    switch(action.type) {
      case 'applyItem': {
        const asset = BCIM.BC.getAssetsForGroup(fam, action.group).find(a=>a.Name===action.assetName);
        if (asset) BCIM.BC.applyItem(target, action.group, asset, action.colors, action.craft, action.property);
        break;
      }
      case 'removeItem': BCIM.BC.removeItem(target, action.group); break;
      case 'applyOutfit': {
        const outfits = BCIM.DB.get('outfits',[]);
        const outfit = outfits.find(o=>o.name===action.outfitName||o.id===action.outfitId);
        if (outfit) BCIM.BC.applySnapshot(target, outfit.items);
        break;
      }
      case 'sendChat': {
        let msg = action.message||'';
        msg = msg.replace('{sender}', sender?.Name||'?');
        msg = msg.replace('{self}', self?.Name||'?');
        BCIM.BC.sendChat(msg);
        break;
      }
      case 'sendEmote': {
        let msg = action.message||'';
        msg = msg.replace('{sender}', sender?.Name||'?');
        BCIM.BC.sendEmote(msg);
        break;
      }
      case 'randomRestraints': {
        BCIM.AUTO.randomRestraints(target, action.config||{slots:['ItemArms'],chatAnnounce:true});
        break;
      }
      case 'macro': {
        const macros = BCIM.DB.get('macros',[]);
        const macro = macros.find(m=>m.name===action.macroName);
        if (macro) BCIM.AUTO.playMacro(target, macro, null, null);
        break;
      }
    }
  },

  // ── !bcim command system ──────────────────────────────────
  // Usage: !bcim outfit [name] | !bcim free | !bcim macro [name] | !bcim random
  _handleCommand: (args, senderChar, senderNumber) => {
    const wl = BCIM.CFG.chatWhitelist||[];
    const isWhitelisted = wl.includes(senderNumber);
    const isSelf = senderChar?.IsPlayer?.();
    if (!isWhitelisted && !isSelf) return;

    const char = BCIM.S.char;
    if (!char) return;
    const cmd = args[0];

    const commands = BCIM.CFG.chatCommands||[];
    const cmdCfg = commands.find(c=>c.command===cmd&&c.active);
    if (!cmdCfg) return;

    BCIM.CHAT._executeAction({
      type: cmdCfg.actionType,
      ...cmdCfg.actionParams,
    }, char, char, senderChar);

    if (cmdCfg.announceExecution) {
      BCIM.BC.sendChat(cmdCfg.announceMessage||`Command ${cmd} ausgeführt.`);
    }
    BCIM.emit('chatCommandFired',{cmd,sender:senderChar});
  },

  // ── Whitelist helpers ─────────────────────────────────────
  addToWhitelist: (memberNumber) => {
    const wl = BCIM.CFG.chatWhitelist||[];
    if (!wl.includes(memberNumber)) { wl.push(memberNumber); BCIM.CFG.chatWhitelist=wl; BCIM.saveCFG(); }
  },
  removeFromWhitelist: (memberNumber) => {
    BCIM.CFG.chatWhitelist = (BCIM.CFG.chatWhitelist||[]).filter(n=>n!==memberNumber);
    BCIM.saveCFG();
  },
  isWhitelisted: (memberNumber) => (BCIM.CFG.chatWhitelist||[]).includes(memberNumber),

  // ── Trigger CRUD ──────────────────────────────────────────
  saveTrigger: (trigger) => {
    const triggers = BCIM.CFG.chatTriggers||[];
    const idx = triggers.findIndex(t=>t.id===trigger.id);
    if (idx>=0) triggers[idx]=trigger; else triggers.push({...trigger,id:Date.now()});
    BCIM.CFG.chatTriggers = triggers; BCIM.saveCFG();
  },
  deleteTrigger: (id) => {
    BCIM.CFG.chatTriggers = (BCIM.CFG.chatTriggers||[]).filter(t=>t.id!==id);
    BCIM.saveCFG();
  },

  // ── Command CRUD ──────────────────────────────────────────
  saveCommand: (cmd) => {
    const cmds = BCIM.CFG.chatCommands||[];
    const idx = cmds.findIndex(c=>c.id===cmd.id);
    if (idx>=0) cmds[idx]=cmd; else cmds.push({...cmd,id:Date.now()});
    BCIM.CFG.chatCommands = cmds; BCIM.saveCFG();
  },
  deleteCommand: (id) => {
    BCIM.CFG.chatCommands = (BCIM.CFG.chatCommands||[]).filter(c=>c.id!==id);
    BCIM.saveCFG();
  },
};
