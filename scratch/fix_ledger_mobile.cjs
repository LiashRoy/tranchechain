const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

if (!content.includes('import { useIsMobile }')) {
  // Update LedgerTab to use the global useIsMobile
  content = content.replace("const [isMobile, setIsMobile] = useState(window.innerWidth < 768)", "const isMobile = useIsMobile();");
  content = content.replace("const handleResize = () => setIsMobile(window.innerWidth < 768)", "");
  content = content.replace("window.addEventListener('resize', handleResize)", "");
  content = content.replace("return () => window.removeEventListener('resize', handleResize)", "");
  content = content.replace("import { useState, useCallback, useEffect } from 'react'", "import { useState, useCallback, useEffect } from 'react'\nimport { useIsMobile } from '../../hooks/useIsMobile'");
  
  // Make the layout container padding responsive
  content = content.replace(/padding: '24px 32px'/g, "padding: isMobile ? '16px 16px' : '24px 32px'");
  content = content.replace(/padding: '24px'/g, "padding: isMobile ? '16px' : '24px'");
  content = content.replace(/padding: '32px 32px 64px'/g, "padding: isMobile ? '20px 16px 40px' : '32px 32px 64px'");

  fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
}
