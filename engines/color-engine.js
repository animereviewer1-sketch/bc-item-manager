// ── BCIM / engines / color-engine.js ─────────────────────
window.BCIM = window.BCIM || {};

BCIM.COLORS = {
  // ── Default palettes ─────────────────────────────────────
  DEFAULT_PALETTES: [
    {id:'p1', name:'Schwarzes Latex',  colors:['#111111','#1a1a1a','#0d0d0d','#222222']},
    {id:'p2', name:'Rotes Leder',      colors:['#8b0000','#a00000','#600000','#c00020']},
    {id:'p3', name:'Lila Latex',       colors:['#4a0080','#6a00aa','#350060','#8000cc']},
    {id:'p4', name:'Weißes Satin',     colors:['#f5f5f5','#ebebeb','#ffffff','#e0e0e0']},
    {id:'p5', name:'Blaues Leder',     colors:['#003366','#004488','#002244','#005599']},
    {id:'p6', name:'Gold',             colors:['#c8a000','#e0b800','#a08000','#f0d000']},
    {id:'p7', name:'Rosa Plüsch',      colors:['#ff80aa','#ff99bb','#ff6699','#ffaacc']},
    {id:'p8', name:'Silber Metall',    colors:['#909090','#b0b0b0','#707070','#c0c0c0']},
    {id:'p9', name:'Dunkles Grün',     colors:['#003300','#004400','#002200','#005500']},
    {id:'p10',name:'Bordeaux Seide',   colors:['#5c0020','#7a0030','#400015','#900040']},
  ],

  // ── Palette management ────────────────────────────────────
  getPalettes: () => {
    const custom = BCIM.DB.get('colorPalettes',[]);
    return [...BCIM.COLORS.DEFAULT_PALETTES, ...custom];
  },

  savePalette: (name, colors) => {
    const custom = BCIM.DB.get('colorPalettes',[]);
    custom.unshift({id:'c'+Date.now(), name, colors: colors.slice(0,8)});
    BCIM.DB.set('colorPalettes',custom);
  },

  deletePalette: (id) => {
    const custom = BCIM.DB.get('colorPalettes',[]);
    BCIM.DB.set('colorPalettes', custom.filter(p=>p.id!==id));
  },

  // Apply palette to item (fills available layers)
  applyPaletteToItem: (char, group, palette) => {
    const item = BCIM.BC.getItem(char, group);
    if (!item) return false;
    const numLayers = Array.isArray(item.Asset?.Color) ? item.Asset.Color.length : 1;
    const colors = [];
    for (let i=0;i<numLayers;i++) colors.push(palette.colors[i%palette.colors.length]);
    BCIM.BC.applyItem(char, group, item.Asset, colors, undefined, undefined);
    return true;
  },

  // Apply palette to all items
  applyPaletteToAll: (char, palette) => {
    if (!char) return 0;
    const groups = BCIM.BC.getGroups(char.AssetFamily||'Female3DCG');
    let count = 0;
    groups.forEach(g => {
      if (BCIM.COLORS.applyPaletteToItem(char,g.Name,palette)) count++;
    });
    return count;
  },

  // ── Gradient colorizer ────────────────────────────────────
  // Generates a gradient between two colors across N layers
  generateGradient: (colorA, colorB, steps) => {
    const rA=parseInt(colorA.slice(1,3),16), gA=parseInt(colorA.slice(3,5),16), bA=parseInt(colorA.slice(5,7),16);
    const rB=parseInt(colorB.slice(1,3),16), gB=parseInt(colorB.slice(3,5),16), bB=parseInt(colorB.slice(5,7),16);
    const result=[];
    for(let i=0;i<steps;i++){
      const t=steps>1?i/(steps-1):0;
      const r=Math.round(rA+(rB-rA)*t);
      const g=Math.round(gA+(gB-gA)*t);
      const b=Math.round(bA+(bB-bA)*t);
      result.push('#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''));
    }
    return result;
  },

  applyGradientToItem: (char, group, colorA, colorB) => {
    const item = BCIM.BC.getItem(char, group);
    if (!item) return false;
    const numLayers = Array.isArray(item.Asset?.Color) ? item.Asset.Color.length : 1;
    const colors = BCIM.COLORS.generateGradient(colorA, colorB, numLayers);
    BCIM.BC.applyItem(char, group, item.Asset, colors, undefined, undefined);
    return true;
  },

  // ── Theme matching ────────────────────────────────────────
  // Analyze currently worn item colors and suggest matching items
  analyzeCurrentColors: (char) => {
    if (!char) return [];
    const snap = BCIM.BC.snapshot(char);
    const allColors = [];
    snap.forEach(s => {
      if (Array.isArray(s.colors)) allColors.push(...s.colors.filter(Boolean));
      else if (s.colors) allColors.push(s.colors);
    });
    return allColors;
  },

  // Get dominant color from current outfit
  getDominantColor: (char) => {
    const colors = BCIM.COLORS.analyzeCurrentColors(char);
    if (!colors.length) return '#111111';
    // Simple: return the most saturated color
    let best=colors[0], bestSat=0;
    colors.forEach(c=>{
      try{
        const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);
        const max=Math.max(r,g,b),min=Math.min(r,g,b);
        const sat=max>0?(max-min)/max:0;
        if(sat>bestSat){bestSat=sat;best=c;}
      }catch{}
    });
    return best;
  },

  // Suggest a matching palette based on current outfit
  suggestMatchingPalette: (char) => {
    const dominant = BCIM.COLORS.getDominantColor(char);
    // Generate a harmonious palette from the dominant color
    const r=parseInt(dominant.slice(1,3),16),g=parseInt(dominant.slice(3,5),16),b=parseInt(dominant.slice(5,7),16);
    // Complementary + shades
    const toHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
    return {
      name: 'Empfohlen (harmonisch)',
      colors: [
        dominant,
        toHex(r*0.7,g*0.7,b*0.7),          // darker
        toHex(r*1.2,g*1.2,b*1.2),          // lighter
        toHex(255-r*0.5,255-g*0.5,255-b*0.5), // soft complement
      ]
    };
  },

  // ── Color harmony generators ──────────────────────────────
  complementary: (hex) => {
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return '#'+[255-r,255-g,255-b].map(v=>v.toString(16).padStart(2,'0')).join('');
  },

  triadic: (hex) => {
    // Rotate hue by 120° (simplified RGB approach)
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    const toHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
    return [hex, toHex(g,b,r), toHex(b,r,g)];
  },

  hexToRgb: (hex) => ({
    r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)
  }),
};
