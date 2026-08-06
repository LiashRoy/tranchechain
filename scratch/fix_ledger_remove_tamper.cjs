const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

// Add the handleRemoveTamper function
const resetStr = "const handleReset = useCallback(() => {";
const handleRemoveStr = `const handleRemoveTamper = useCallback(() => {
    setBlocks(prev => {
      const restored = prev.map(b => 
        b.wasTampered ? { ...b, amount: b.originalAmount, wasTampered: false } : { ...b }
      );
      for (let i = 0; i < restored.length; i++) {
        if (i > 0) restored[i].prevHash = restored[i - 1].hash;
        restored[i].hash = computeHash(restored[i]);
      }
      return validateChain(restored);
    });
    setVisibleInvalid(new Set());
    setBannerInfo(null);
  }, []);

  `;
content = content.replace(resetStr, handleRemoveStr + resetStr);

// Pass onRemoveTamper to StatsBar
content = content.replace("<StatsBar blocks={blocks} onReset={handleReset} />", "<StatsBar blocks={blocks} onReset={handleReset} onRemoveTamper={handleRemoveTamper} />");

// Update StatsBar signature
content = content.replace("function StatsBar({ blocks, onReset }) {", "function StatsBar({ blocks, onReset, onRemoveTamper }) {");

// Add the button
const buttonStr = `<div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onReset}`;
const newButtonStr = `<div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
        {!isClean && (
          <button
            onClick={onRemoveTamper}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#34d399', fontFamily: 'Manrope, sans-serif',
              fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.18)'
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            Remove Tamper
          </button>
        )}
        <button
          onClick={onReset}`;
content = content.replace(buttonStr, newButtonStr);

fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
