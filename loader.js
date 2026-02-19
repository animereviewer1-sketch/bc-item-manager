// ── BCIM loader.js ────────────────────────────────────────
(function () {
  const BASE = 'https://animereviewer1-sketch.github.io/bc-item-manager/';

  const MODULES = [
    'storage.js',
    'state.js',
    'bc-api.js',
    'sync.js',
    'styles.js',
    'elements.js',
    'automation-engine.js',
    'chat-engine.js',
    'karma-engine.js',
    'color-engine.js',
    'tab-configurator.js',
    'tab-outfits.js',
    'tab-locks.js',
    'tab-monitor.js',
    'tab-automation.js',
    'tab-chat.js',
    'tab-games.js',
    'tab-karma.js',
    'tab-colors.js',
    'tab-rules.js',
    'tab-stats.js',
    'tab-settings.js',
    'main.js',
  ];

  if (document.getElementById('bcim-root')) {
    document.getElementById('bcim-root').remove();
  }

  const ts = Date.now();
  let chain = Promise.resolve();
  MODULES.forEach(mod => {
    chain = chain.then(() => new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = BASE + mod + '?t=' + ts;
      s.onload  = resolve;
      s.onerror = () => { console.error('[BCIM] Fehler beim Laden:', mod); resolve(); };
      document.head.appendChild(s);
    }));
  });
})();
