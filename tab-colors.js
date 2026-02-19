// ── BCIM / tabs / tab-colors.js ───────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_COLORS = () => {
  const {el,UI,S,BC,COLORS,setStatus,SLOT_LABELS} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ══ PALETTEN-BIBLIOTHEK ═══════════════════════════════════
  body.appendChild(UI.section('🎨 Paletten-Bibliothek'));

  const palListEl=el('div');
  const renderPalettes=()=>{
    palListEl.innerHTML='';
    COLORS.getPalettes().forEach(pal=>{
      const card=el('div',{class:'card'});
      const header=el('div',{class:'card-row',style:{marginBottom:'6px'}},
        el('span',{class:'card-title',style:{flex:1}},pal.name),
      );
      // Color swatches
      const swatches=el('div',{class:'pal-row'});
      pal.colors.forEach(c=>{
        swatches.appendChild(el('div',{class:'pal-swatch',style:{background:c},title:c}));
      });
      // Actions
      const actRow=el('div',{class:'card-actions'});
      const applyItemBtn=el('button',{class:'sbtn'},'Auf Item');
      const applyAllBtn =el('button',{class:'sbtn sbtn-p'},'Auf Alle');
      applyItemBtn.addEventListener('click',()=>{
        if(!S.char||!S.group){setStatus('Slot wählen!',true);return;}
        COLORS.applyPaletteToItem(S.char,S.group,pal);
        setStatus(`✓ Palette auf ${SLOT_LABELS[S.group]||S.group}`,false);
      });
      applyAllBtn.addEventListener('click',()=>{
        if(!S.char){setStatus('Spieler wählen!',true);return;}
        const count=COLORS.applyPaletteToAll(S.char,pal);
        setStatus(`✓ Palette auf ${count} Items angewendet`,false);
      });
      [applyItemBtn,applyAllBtn].forEach(b=>actRow.appendChild(b));
      // Delete (only custom)
      if(pal.id.startsWith('c')){
        const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
        delBtn.addEventListener('click',()=>{COLORS.deletePalette(pal.id);renderPalettes();});
        actRow.appendChild(delBtn);
      }
      [header,swatches,actRow].forEach(n=>card.appendChild(n));
      palListEl.appendChild(card);
    });
  };
  renderPalettes();
  body.appendChild(palListEl);

  // ── Neue Palette erstellen ──
  body.appendChild(UI.section('+ Neue Palette'));
  const newPalCard=el('div',{class:'card'});
  const palNameInp=el('input',{type:'text',class:'bi',placeholder:'Paletten-Name...',style:{marginBottom:'6px'}});
  let newColors=['#111111','#333333','#555555','#777777'];
  const newColorRow=el('div',{class:'bcg'});
  const refreshNewColors=()=>{
    newColorRow.innerHTML='';
    newColors.forEach((c,i)=>{
      const inp=el('input',{type:'color',class:'bcp',value:c});
      inp.addEventListener('input',e=>newColors[i]=e.target.value);
      newColorRow.appendChild(el('div',{class:'bci'},inp,el('div',{class:'bcl'},'C'+(i+1))));
    });
    if(newColors.length<8){
      const addBtn=el('button',{class:'sbtn',style:{height:'30px',padding:'0 8px'}},'+ Farbe');
      addBtn.addEventListener('click',()=>{newColors.push('#888888');refreshNewColors();});
      newColorRow.appendChild(addBtn);
    }
  };
  refreshNewColors();
  const saveNewPalBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'6px'}},'💾 Palette speichern');
  saveNewPalBtn.addEventListener('click',()=>{
    if(!palNameInp.value.trim())return;
    COLORS.savePalette(palNameInp.value.trim(),newColors);
    palNameInp.value=''; setStatus('Palette gespeichert',false); renderPalettes();
  });
  newPalCard.appendChild(palNameInp); newPalCard.appendChild(newColorRow); newPalCard.appendChild(saveNewPalBtn);
  body.appendChild(newPalCard);

  // ══ GRADIENT COLORIZER ════════════════════════════════════
  body.appendChild(UI.section('🌈 Gradient-Colorizer'));
  body.appendChild(el('div',{class:'section-note'},'Generiert einen Farbverlauf über alle Farb-Layer eines Items.'));

  const gradCard=el('div',{class:'card'});
  const colorARow=el('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginBottom:'6px'}});
  let gradA='#4a0080', gradB='#f472b6';
  const cAInp=el('input',{type:'color',class:'bcp',value:gradA,style:{width:'40px',height:'40px'}});
  cAInp.addEventListener('input',e=>{gradA=e.target.value;updateGradPreview();});
  const cBInp=el('input',{type:'color',class:'bcp',value:gradB,style:{width:'40px',height:'40px'}});
  cBInp.addEventListener('input',e=>{gradB=e.target.value;updateGradPreview();});
  const gradPreview=el('div',{style:{flex:1,height:'20px',borderRadius:'6px',border:'1px solid var(--brd)'}});
  const updateGradPreview=()=>{gradPreview.style.background=`linear-gradient(90deg,${gradA},${gradB})`;};
  updateGradPreview();
  [el('span',{class:'card-sub'},'Von:'),cAInp,el('span',{class:'card-sub'},'Bis:'),cBInp,gradPreview].forEach(n=>colorARow.appendChild(n));
  gradCard.appendChild(colorARow);

  const applyGradItemBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'5px'}},'Auf gewähltes Item anwenden');
  const applyGradAllBtn =el('button',{class:'sbtn',style:{width:'100%'}},'Auf alle Items anwenden');
  applyGradItemBtn.addEventListener('click',()=>{
    if(!S.char||!S.group){setStatus('Slot wählen!',true);return;}
    COLORS.applyGradientToItem(S.char,S.group,gradA,gradB);
    setStatus(`✓ Gradient auf ${SLOT_LABELS[S.group]||S.group}`,false);
  });
  applyGradAllBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Spieler wählen!',true);return;}
    let count=0;
    BCIM.BC.getGroups(S.char.AssetFamily||'Female3DCG').forEach(g=>{
      if(BCIM.BC.getItem(S.char,g.Name)){COLORS.applyGradientToItem(S.char,g.Name,gradA,gradB);count++;}
    });
    setStatus(`✓ Gradient auf ${count} Items`,false);
  });
  [applyGradItemBtn,applyGradAllBtn].forEach(b=>gradCard.appendChild(b));
  body.appendChild(gradCard);

  // Triadic preview
  body.appendChild(UI.section('🔵 Harmonie-Generator'));
  const harmCard=el('div',{class:'card'});
  let baseColor='#c084fc';
  const baseInp=el('input',{type:'color',class:'bcp',value:baseColor,style:{width:'40px',height:'40px'}});
  baseInp.addEventListener('input',e=>{baseColor=e.target.value;updateHarm();});
  const harmRow=el('div',{class:'pal-row',style:{marginTop:'6px'}});
  const harmLabels=el('div',{class:'section-note',style:{marginTop:'4px'}});
  const updateHarm=()=>{
    harmRow.innerHTML='';
    const tri=COLORS.triadic(baseColor);
    const comp=COLORS.complementary(baseColor);
    [baseColor,...tri,comp].forEach((c,i)=>{
      const labels=['Basis','Triadisch 1','Triadisch 2','Triadisch 3','Komplementär'];
      harmRow.appendChild(el('div',{class:'pal-swatch',style:{background:c,width:'28px',height:'28px'},title:labels[i]||c}));
    });
    harmLabels.textContent='Klicke auf einen Swatch um die Farbe zu kopieren';
    // Apply harmony as palette button
  };
  updateHarm();
  const saveSuggBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'6px'}},'Als Palette speichern');
  saveSuggBtn.addEventListener('click',()=>{
    const tri=COLORS.triadic(baseColor);
    const comp=COLORS.complementary(baseColor);
    COLORS.savePalette(`Harmonie ${baseColor}`, [baseColor,...tri,comp]);
    setStatus('Palette gespeichert!',false); renderPalettes();
  });
  harmCard.appendChild(el('div',{class:'card-row'},el('span',{class:'card-sub'},'Basisfarbe:'),baseInp));
  harmCard.appendChild(harmRow); harmCard.appendChild(harmLabels); harmCard.appendChild(saveSuggBtn);
  body.appendChild(harmCard);

  // ══ THEME MATCHING ════════════════════════════════════════
  body.appendChild(UI.section('✨ Theme Matching'));
  body.appendChild(el('div',{class:'section-note'},'Analysiert dein aktuelles Outfit und schlägt passende Farben vor.'));

  const matchCard=el('div',{class:'card'});
  const analyzeBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'6px'}},'🔍 Outfit analysieren');
  const matchResultEl=el('div');
  analyzeBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Spieler wählen!',true);return;}
    matchResultEl.innerHTML='';
    const dominant=COLORS.getDominantColor(S.char);
    const suggested=COLORS.suggestMatchingPalette(S.char);
    const domRow=el('div',{class:'card-row',style:{marginBottom:'6px'}},
      el('span',{class:'card-sub'},'Dominante Farbe:'),
      el('div',{class:'pal-swatch',style:{background:dominant,width:'24px',height:'24px'}}),
      el('span',{style:{fontFamily:'monospace',fontSize:'11px',color:'var(--txt2)'}},dominant),
    );
    const sugRow=el('div');
    sugRow.appendChild(el('div',{class:'card-sub',style:{marginBottom:'4px'}},suggested.name+':'));
    const sugSwatches=el('div',{class:'pal-row'});
    suggested.colors.forEach(c=>sugSwatches.appendChild(el('div',{class:'pal-swatch',style:{background:c},title:c})));
    sugRow.appendChild(sugSwatches);
    const applySugBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'6px'}},'Vorschlag anwenden');
    applySugBtn.addEventListener('click',()=>{
      COLORS.applyPaletteToAll(S.char,suggested);
      setStatus('Theme angewendet!',false);
    });
    const saveSugBtn=el('button',{class:'sbtn',style:{width:'100%',marginTop:'4px'}},'Als Palette speichern');
    saveSugBtn.addEventListener('click',()=>{COLORS.savePalette(suggested.name,suggested.colors);renderPalettes();setStatus('Palette gespeichert',false);});
    sugRow.appendChild(applySugBtn); sugRow.appendChild(saveSugBtn);
    [domRow,sugRow].forEach(n=>matchResultEl.appendChild(n));
  });
  matchCard.appendChild(analyzeBtn); matchCard.appendChild(matchResultEl);
  body.appendChild(matchCard);

  return body;
};
