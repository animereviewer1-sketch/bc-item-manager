// ── BCIM / tabs / tab-stats.js ────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_STATS = () => {
  const {el, UI, DB, SYNC, setStatus, SLOT_LABELS} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ── Slot Heatmap ──────────────────────────────────────────
  body.appendChild(UI.section('🔥 Slot Heatmap (Tragedauer)'));
  const diary = DB.get('diary',[]);
  const slotTime = {};
  diary.forEach(d=>{ slotTime[d.group]=(slotTime[d.group]||0)+(d.duration||0); });
  const sorted = Object.entries(slotTime).sort((a,b)=>b[1]-a[1]).slice(0,14);

  if(!sorted.length){
    body.appendChild(el('div',{class:'bempty'},'Noch keine Daten — lege Items an und trage sie!'));
  } else {
    const maxVal = sorted[0][1];
    sorted.forEach(([group,ms])=>{
      const pct = Math.round((ms/maxVal)*100);
      const hrs = Math.round(ms/3600000*10)/10;
      const row = el('div',{class:'hbar'});
      row.appendChild(el('div',{class:'hbar-label',title:group},SLOT_LABELS[group]||group));
      const track=el('div',{class:'hbar-track'});
      track.appendChild(el('div',{class:'hbar-fill',style:{width:pct+'%'}}));
      row.appendChild(track);
      row.appendChild(el('div',{class:'hbar-val'},hrs+'h'));
      body.appendChild(row);
    });
  }

  // ── Item Diary ────────────────────────────────────────────
  body.appendChild(UI.section('📖 Item Tagebuch'));
  const recentDiary = diary.slice(0,25);
  if(!recentDiary.length){
    body.appendChild(el('div',{class:'bempty'},'Noch keine Einträge'));
  } else {
    recentDiary.forEach(d=>{
      const dur  = SYNC.formatDuration(d.duration);
      const name = (d.assetName||'?').replace(/([A-Z])/g,' $1').trim();
      const start= d.startTime ? new Date(d.startTime).toLocaleTimeString() : '?';
      body.appendChild(el('div',{class:'card'},
        el('div',{class:'card-title',style:{fontSize:'11px'}},(SLOT_LABELS[d.group]||d.group)+': '+name),
        el('div',{class:'card-sub'},`${d.date}  ·  ${start}  ·  ${dur}`),
      ));
    });
    const clrDiaryBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginTop:'4px'}},'🗑 Tagebuch leeren');
    clrDiaryBtn.addEventListener('click',()=>{
      BCIM.UI.confirmOverlay('Tagebuch wirklich leeren?',()=>{DB.del('diary');setStatus('Tagebuch geleert',false);});
    });
    body.appendChild(clrDiaryBtn);
  }

  // ── Session Export ────────────────────────────────────────
  body.appendChild(UI.section('💾 Session Export'));
  const session=DB.get('session',[]);
  const expCard=el('div',{class:'card'});
  expCard.appendChild(el('div',{class:'card-sub',style:{marginBottom:'6px'}},
    `${session.length} Einträge · ${diary.length} Tagebuch-Einträge`
  ));

  const expBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'5px'}},'📥 Alles als JSON exportieren');
  expBtn.addEventListener('click',()=>{
    const data={
      outfits:  DB.get('outfits',[]),
      diary:    DB.get('diary',[]),
      session:  DB.get('session',[]),
      history:  DB.get('history',[]),
      karmaLog: DB.get('karmaLog',[]),
      gambles:  DB.get('gamblingLog',[]),
      exportedAt: new Date().toISOString(),
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`bcim-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });

  const importBtn=el('button',{class:'sbtn',style:{width:'100%',marginBottom:'5px'}},'📤 JSON importieren');
  importBtn.addEventListener('click',()=>{
    const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
    inp.addEventListener('change',()=>{
      const f=inp.files[0]; if(!f)return;
      const reader=new FileReader();
      reader.onload=e=>{
        try {
          const data=JSON.parse(e.target.result);
          if(data.outfits)  DB.set('outfits',  data.outfits);
          if(data.diary)    DB.set('diary',     data.diary);
          if(data.session)  DB.set('session',   data.session);
          if(data.history)  DB.set('history',   data.history);
          setStatus(`✓ Import: ${data.outfits?.length||0} Outfits, ${data.diary?.length||0} Diary-Einträge`,false);
        } catch { setStatus('❌ Ungültiges JSON',true); }
      };
      reader.readAsText(f);
    });
    inp.click();
  });

  const clrBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%'}},'🗑 Alle BCIM-Daten löschen');
  clrBtn.addEventListener('click',()=>{
    BCIM.UI.confirmOverlay('Wirklich ALLE BCIM-Daten aus dem LocalStorage löschen?',()=>{
      ['outfits','diary','session','history','rules','lockLog','lockHierarchy','macros','sequences',
       'karmaPoints','karmaLog','gamblingLog','karmaLeaderboard','diceConfig','rouletteItems','penalties','lootCfg',
       'colorPalettes','chatLog','settings'].forEach(k=>DB.del(k));
      setStatus('Alle Daten gelöscht',false);
    });
  });

  [expBtn,importBtn,clrBtn].forEach(b=>expCard.appendChild(b));
  body.appendChild(expCard);

  // ── Karma stats summary ───────────────────────────────────
  if(BCIM.KARMA){
    body.appendChild(UI.section('⭐ Karma Zusammenfassung'));
    const kCard=el('div',{class:'card'});
    const pts=BCIM.KARMA.getPoints();
    const gstats=BCIM.KARMA.getGamblingStats();
    const klog=DB.get('karmaLog',[]);
    const totalEarned=klog.filter(e=>e.pts>0).reduce((s,e)=>s+e.pts,0);
    const totalSpent =klog.filter(e=>e.pts<0).reduce((s,e)=>s+Math.abs(e.pts),0);
    [
      ['Aktuell',      pts+'⭐'],
      ['Gesamt verdient', totalEarned+'⭐'],
      ['Gesamt ausgegeben',totalSpent+'⭐'],
      ['Gambling Spiele',gstats.games+''],
      ['Gambling Netto',  (gstats.totalWon-gstats.totalBet)+'⭐'],
    ].forEach(([label,val])=>{
      kCard.appendChild(el('div',{class:'card-row',style:{marginBottom:'4px'}},
        el('span',{class:'card-sub',style:{flex:1}},label),
        el('span',{style:{fontSize:'12px',color:'var(--acc)',fontWeight:'600'}},val),
      ));
    });
    body.appendChild(kCard);
  }

  return body;
};
