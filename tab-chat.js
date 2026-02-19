// ── BCIM / tabs / tab-chat.js ─────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_CHAT = () => {
  const {el,UI,S,BC,CHAT,DB,CFG,saveCFG,setStatus,SLOT_LABELS,SLOT_ORDER} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ══ ENGINE STATUS ═════════════════════════════════════════
  body.appendChild(UI.section('💬 Chat-Engine'));
  const engState=el('div',{class:'section-note'},CHAT.active()?'🟢 Aktiv':'⚫ Inaktiv');
  body.appendChild(engState);

  const engRow=el('div',{style:{display:'flex',gap:'5px',marginBottom:'8px'}});
  const startEngBtn=el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'▶ Aktivieren');
  const stopEngBtn =el('button',{class:'sbtn sbtn-d',style:{flex:'1'}},'⏹ Deaktivieren');
  startEngBtn.addEventListener('click',()=>{CHAT.start();engState.textContent='🟢 Aktiv';setStatus('Chat-Engine aktiv',false);});
  stopEngBtn.addEventListener('click', ()=>{CHAT.stop(); engState.textContent='⚫ Inaktiv';});
  engRow.appendChild(startEngBtn); engRow.appendChild(stopEngBtn);
  body.appendChild(engRow);

  // ══ WHITELIST ═════════════════════════════════════════════
  body.appendChild(UI.section('🔒 Whitelist (wer Befehle senden darf)'));
  const wlEl=el('div');
  const renderWL=()=>{
    wlEl.innerHTML='';
    const wl=CFG.chatWhitelist||[];
    if(!wl.length) wlEl.appendChild(el('div',{class:'section-note'},'Leer — nur eigene Nachrichten werden verarbeitet.'));
    wl.forEach((num,i)=>{
      // Try to find player name
      const char=BC.player(num);
      const name=char?`${char.Name} (#${num})`:`#${num}`;
      const row=el('div',{class:'card-row',style:{marginBottom:'4px'}},
        el('span',{style:{flex:1,fontSize:'11px'}},name),
        el('button',{class:'sbtn sbtn-d',style:{padding:'2px 6px'}},'Entfernen'),
      );
      row.querySelector('.sbtn').addEventListener('click',()=>{CHAT.removeFromWhitelist(num);renderWL();});
      wlEl.appendChild(row);
    });
  };
  renderWL();
  body.appendChild(wlEl);

  const addWLRow=el('div',{style:{display:'flex',gap:'5px',marginBottom:'8px'}});
  const wlSel=el('select',{class:'bsel',style:{flex:'1'}});
  wlSel.appendChild(el('option',{value:''},'Spieler wählen...'));
  BC.players().filter(c=>!c.IsPlayer?.()).forEach(c=>{wlSel.appendChild(el('option',{value:c.MemberNumber},c.Name||`#${c.MemberNumber}`));});
  const addWLBtn=el('button',{class:'sbtn sbtn-p'},'+ Hinzufügen');
  addWLBtn.addEventListener('click',()=>{
    if(!wlSel.value)return;
    CHAT.addToWhitelist(parseInt(wlSel.value));
    renderWL();
  });
  addWLRow.appendChild(wlSel); addWLRow.appendChild(addWLBtn);
  body.appendChild(addWLRow);

  // ══ KEYWORD TRIGGERS ══════════════════════════════════════
  body.appendChild(UI.section('⚡ Keyword-Trigger'));
  body.appendChild(el('div',{class:'section-note'},'Wenn das Schlüsselwort im Chat erscheint, werden die Aktionen ausgeführt.'));

  const triggerListEl=el('div');
  const renderTriggers=()=>{
    triggerListEl.innerHTML='';
    const triggers=CFG.chatTriggers||[];
    if(!triggers.length) triggerListEl.appendChild(el('div',{class:'section-note'},'Keine Trigger definiert.'));
    triggers.forEach((t,i)=>{
      const card=el('div',{class:'card'});
      const header=el('div',{class:'card-row',style:{marginBottom:'5px'}},
        el('span',{class:'trigger-active '+(t.active?'on':'off')}),
        el('span',{class:'trigger-kw'},'\"'+t.keyword+'\"'),
        el('span',{class:'trigger-action',style:{flex:1}},`→ ${t.actions?.length||0} Aktionen`),
        el('button',{class:'sbtn',style:{padding:'2px 7px'}},t.active?'Deaktivieren':'Aktivieren'),
        el('button',{class:'sbtn sbtn-d',style:{padding:'2px 6px'}},'✕'),
      );
      header.querySelectorAll('.sbtn')[0].addEventListener('click',()=>{t.active=!t.active;CHAT.saveTrigger(t);renderTriggers();});
      header.querySelectorAll('.sbtn')[1].addEventListener('click',()=>{CHAT.deleteTrigger(t.id);renderTriggers();});
      // Actions summary
      (t.actions||[]).forEach(a=>{
        card.appendChild(el('div',{class:'card-sub',style:{marginLeft:'12px'}},
          `• ${a.type}: ${SLOT_LABELS[a.group]||a.group||''} ${a.assetName||a.message||''} ${a.delay?'(+'+Math.round((a.delay||0)/1000)+'s)':''}`
        ));
      });
      card.appendChild(header);
      triggerListEl.appendChild(card);
    });
  };
  renderTriggers();
  body.appendChild(triggerListEl);

  // Add trigger button
  const addTrigBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'5px'}},'+ Neuer Trigger');
  addTrigBtn.addEventListener('click',()=>openTriggerEditor(null));
  body.appendChild(addTrigBtn);

  // ══ CHAT COMMANDS ═════════════════════════════════════════
  body.appendChild(UI.section('🤖 Chat-Befehle (!bcim)'));
  body.appendChild(el('div',{class:'section-note'},'Whitelist-Spieler können diese Befehle mit !bcim [befehl] senden.'));

  const cmdListEl=el('div');
  const renderCommands=()=>{
    cmdListEl.innerHTML='';
    const cmds=CFG.chatCommands||[];
    if(!cmds.length) cmdListEl.appendChild(el('div',{class:'section-note'},'Keine Befehle definiert.'));
    cmds.forEach((cmd,i)=>{
      const row=el('div',{class:'trigger-row'},
        el('span',{class:'trigger-active '+(cmd.active?'on':'off')}),
        el('span',{class:'trigger-kw'},'!bcim '+cmd.command),
        el('span',{class:'trigger-action'},cmd.actionType),
        el('button',{class:'sbtn',style:{padding:'2px 5px',fontSize:'10px'}},cmd.active?'An':'Aus'),
        el('button',{class:'sbtn sbtn-d',style:{padding:'2px 5px',fontSize:'10px'}},'✕'),
      );
      row.querySelectorAll('.sbtn')[0].addEventListener('click',()=>{cmd.active=!cmd.active;CHAT.saveCommand(cmd);renderCommands();});
      row.querySelectorAll('.sbtn')[1].addEventListener('click',()=>{CHAT.deleteCommand(cmd.id);renderCommands();});
      cmdListEl.appendChild(row);
    });
  };
  renderCommands();
  body.appendChild(cmdListEl);

  const addCmdBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'5px'}},'+ Neuer Befehl');
  addCmdBtn.addEventListener('click',()=>openCommandEditor(null));
  body.appendChild(addCmdBtn);

  // ══ CHAT LOG ══════════════════════════════════════════════
  body.appendChild(UI.section('📋 Chat-Log'));
  const chatLog=DB.get('chatLog',[]).slice(0,10);
  if(!chatLog.length) body.appendChild(el('div',{class:'section-note'},'Noch keine Trigger ausgelöst.'));
  chatLog.forEach(e=>{
    body.appendChild(el('div',{class:'card-row',style:{marginBottom:'3px'}},
      el('span',{style:{fontSize:'10px',color:'var(--acc)'}},'"'+e.keyword+'"'),
      el('span',{style:{fontSize:'10px',color:'var(--txt2)',flex:'1'}},e.sender||'?'),
      el('span',{style:{fontSize:'9px',color:'var(--txt3)'}},new Date(e.timestamp).toLocaleTimeString()),
    ));
  });

  // ── Trigger editor overlay ───────────────────────────────
  function openTriggerEditor(existing) {
    const ov=el('div',{style:{position:'fixed',inset:'0',background:'rgba(0,0,0,.75)',zIndex:'199999',
      display:'flex',alignItems:'center',justifyContent:'center'}});
    const box=el('div',{style:{background:'var(--bg)',border:'1px solid var(--brd)',borderRadius:'14px',
      padding:'14px',width:'360px',maxHeight:'80vh',overflowY:'auto',color:'var(--txt)'}});

    let trigger={keyword:'',matchMode:'contains',senderFilter:'any',targetSelf:true,active:true,actions:[],...(existing||{})};

    const kwInp=el('input',{type:'text',class:'bi',value:trigger.keyword,placeholder:'Schlüsselwort...',style:{marginBottom:'5px'}});
    kwInp.addEventListener('input',e=>trigger.keyword=e.target.value);

    const matchSel=el('select',{class:'bsel',style:{marginBottom:'5px'}});
    [['contains','Enthält Wort'],['exact','Exakt']].forEach(([v,l])=>{
      const o=el('option',{value:v},l);if(v===trigger.matchMode)o.selected=true;matchSel.appendChild(o);
    });
    matchSel.addEventListener('change',e=>trigger.matchMode=e.target.value);

    const senderSel=el('select',{class:'bsel',style:{marginBottom:'5px'}});
    [['any','Von jedem'],['whitelist','Nur Whitelist'],['self','Nur ich selbst']].forEach(([v,l])=>{
      const o=el('option',{value:v},l);if(v===trigger.senderFilter)o.selected=true;senderSel.appendChild(o);
    });
    senderSel.addEventListener('change',e=>trigger.senderFilter=e.target.value);

    const targetRow=UI.toggle('Auf mich selbst anwenden',trigger.targetSelf,v=>trigger.targetSelf=v);

    // Actions
    const actionsEl=el('div');
    const renderActions=()=>{
      actionsEl.innerHTML='';
      trigger.actions.forEach((a,i)=>{
        const row=el('div',{style:{display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px',
          padding:'5px',background:'var(--bg2)',borderRadius:'7px',border:'1px solid var(--brd)'}},
          el('span',{style:{fontSize:'11px',flex:1}},`${a.type}: ${SLOT_LABELS[a.group]||a.group||''} ${a.assetName||a.message||''}`),
          el('button',{class:'sbtn sbtn-d',style:{padding:'2px 5px'}},'✕'),
        );
        row.querySelector('.sbtn').addEventListener('click',()=>{trigger.actions.splice(i,1);renderActions();});
        actionsEl.appendChild(row);
      });
    };
    renderActions();

    // Add action row
    const actTypeSel=el('select',{class:'bsel',style:{flex:'1'}});
    [['applyItem','Item anlegen'],['removeItem','Item entfernen'],['applyOutfit','Outfit anlegen'],
     ['sendChat','Chat schreiben'],['sendEmote','Emote senden'],['randomRestraints','Zufalls-Restraints'],['macro','Makro abspielen']
    ].forEach(([v,l])=>actTypeSel.appendChild(el('option',{value:v},l)));

    const actGroupSel=el('select',{class:'bsel',style:{flex:'1'}});
    actGroupSel.appendChild(el('option',{value:''},'Slot...'));
    SLOT_ORDER.forEach(g=>actGroupSel.appendChild(el('option',{value:g},SLOT_LABELS[g]||g)));

    const actAssetInp=el('input',{type:'text',class:'bi',placeholder:'Item/Text/Outfit...',style:{flex:'2'}});
    const actDelayInp=el('input',{type:'number',class:'bi',placeholder:'Delay ms',value:'0',style:{flex:'0 0 60px'}});

    const addActBtn=el('button',{class:'sbtn sbtn-p'},'+ Aktion');
    addActBtn.addEventListener('click',()=>{
      trigger.actions.push({
        type:actTypeSel.value, group:actGroupSel.value,
        assetName:actAssetInp.value.trim(),
        message:actAssetInp.value.trim(),
        outfitName:actAssetInp.value.trim(),
        macroName:actAssetInp.value.trim(),
        delay:parseInt(actDelayInp.value)||0,
      });
      actAssetInp.value=''; renderActions();
    });

    const actRow=el('div',{style:{display:'flex',gap:'4px',marginTop:'6px',flexWrap:'wrap'}});
    [actTypeSel,actGroupSel,actAssetInp,actDelayInp,addActBtn].forEach(n=>actRow.appendChild(n));

    const saveBtn=el('button',{class:'sbtn sbtn-p',style:{flex:'1',marginTop:'8px'}},'💾 Speichern');
    saveBtn.addEventListener('click',()=>{
      if(!trigger.keyword.trim())return;
      CHAT.saveTrigger(trigger);
      ov.remove(); renderTriggers();
    });
    const cancelBtn=el('button',{class:'sbtn',style:{flex:'1',marginTop:'8px'}},'Abbrechen');
    cancelBtn.addEventListener('click',()=>ov.remove());
    const btnRow=el('div',{style:{display:'flex',gap:'5px'}});
    btnRow.appendChild(cancelBtn); btnRow.appendChild(saveBtn);

    [el('div',{style:{fontWeight:'600',color:'var(--acc)',marginBottom:'8px'}},'Trigger konfigurieren'),
     el('label',{class:'bl'},'Schlüsselwort'),kwInp,
     el('label',{class:'bl'},'Match-Modus'),matchSel,
     el('label',{class:'bl'},'Wer darf auslösen'),senderSel,targetRow,
     el('hr',{style:{border:'none',borderTop:'1px solid var(--brd)',margin:'8px 0'}}),
     el('div',{style:{fontWeight:'500',color:'var(--txt)',marginBottom:'5px'}},'Aktionen'),
     actionsEl, actRow, btnRow
    ].forEach(n=>box.appendChild(n));
    ov.appendChild(box); ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
  }

  function openCommandEditor(existing) {
    const ov=el('div',{style:{position:'fixed',inset:'0',background:'rgba(0,0,0,.75)',zIndex:'199999',
      display:'flex',alignItems:'center',justifyContent:'center'}});
    const box=el('div',{style:{background:'var(--bg)',border:'1px solid var(--brd)',borderRadius:'14px',
      padding:'14px',width:'320px',color:'var(--txt)'}});
    let cmd={command:'',actionType:'applyOutfit',actionParams:{},announceExecution:true,announceMessage:'',active:true,...(existing||{})};

    const cmdInp=el('input',{type:'text',class:'bi',value:cmd.command,placeholder:'Befehl (z.B. free)',style:{marginBottom:'5px'}});
    cmdInp.addEventListener('input',e=>cmd.command=e.target.value);
    const typeSel=el('select',{class:'bsel',style:{marginBottom:'5px'}});
    [['applyOutfit','Outfit anlegen'],['freeAll','Alle Items entfernen'],['macro','Makro abspielen'],['randomRestraints','Zufalls-Restraints']].forEach(([v,l])=>{
      const o=el('option',{value:v},l);if(v===cmd.actionType)o.selected=true;typeSel.appendChild(o);
    });
    typeSel.addEventListener('change',e=>cmd.actionType=e.target.value);
    const msgInp=el('input',{type:'text',class:'bi',value:cmd.announceMessage,placeholder:'Antwort-Nachricht...',style:{marginBottom:'5px'}});
    msgInp.addEventListener('input',e=>cmd.announceMessage=e.target.value);
    const announceRow=UI.toggle('Ausführung bestätigen',cmd.announceExecution,v=>cmd.announceExecution=v);
    const saveBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'8px'}},'💾 Speichern');
    saveBtn.addEventListener('click',()=>{if(!cmd.command.trim())return;CHAT.saveCommand(cmd);ov.remove();renderCommands();});
    const cancelBtn=el('button',{class:'sbtn',style:{width:'100%',marginTop:'4px'}},'Abbrechen');
    cancelBtn.addEventListener('click',()=>ov.remove());
    [el('div',{style:{fontWeight:'600',color:'var(--acc)',marginBottom:'8px'}},'Befehl konfigurieren'),
     el('label',{class:'bl'},'!bcim [Befehl]'),cmdInp,
     el('label',{class:'bl'},'Aktion'),typeSel,
     el('label',{class:'bl'},'Antwort-Nachricht'),msgInp,announceRow,saveBtn,cancelBtn
    ].forEach(n=>box.appendChild(n));
    ov.appendChild(box); ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
  }

  return body;
};
