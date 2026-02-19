// ── BCIM / loader.js ─────────────────────────────────────
// Lädt alle Module der richtigen Reihenfolge
// Dieses ist die einzige Datei die im Bookmarklet referenziert wird
(function() {
  const BASE = 'https://raw.githubusercontent.com/DEIN_USERNAME/bc-item-manager/main/';

  // Ladereihenfolge: Core → Engines → UI → Tabs → Main
  const MODULES = [
    // Core
    'core/storage.js',
    'core/state.js',
    'core/bc-api.js',
    'core/sync.js',
    // UI
    'ui/styles.js',
    'ui/elements.js',
    // Engines
    'engines/automation-engine.js',
    'engines/chat-engine.js',
    'engines/karma-engine.js',
    'engines/color-engine.js',
    // Tabs (new)
    'tabs/tab-automation.js',
    'tabs/tab-chat.js',
    'tabs/tab-games.js',
    'tabs/tab-karma.js',
    'tabs/tab-colors.js',
    // Tabs (existing – from v2)
    'tabs/tab-outfits.js',
    'tabs/tab-locks.js',
    'tabs/tab-monitor.js',
    'tabs/tab-rules.js',
    'tabs/tab-stats.js',
    'tabs/tab-settings.js',
    'tabs/tab-configurator.js',
    // Entry point
    'main.js',
  ];

  // Remove old instance
  if (document.getElementById('bcim-root')) {
    document.getElementById('bcim-root').remove();
  }

  // Load scripts sequentially
  const ts = Date.now(); // cache bust
  let chain = Promise.resolve();
  MODULES.forEach(mod => {
    chain = chain.then(() => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = BASE + mod + '?t=' + ts;
      s.onload  = resolve;
      s.onerror = () => { console.error('[BCIM] Failed to load:', mod); resolve(); /* continue anyway */ };
      document.head.appendChild(s);
    }));
  });

  chain.catch(e => console.error('[BCIM] Loader error:', e));
})();
