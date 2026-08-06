const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.jsx', 'utf8');

// Add import
if (!content.includes("import { useIsMobile }")) {
  content = content.replace("import { Link } from 'react-router-dom'", "import { Link } from 'react-router-dom'\nimport { useIsMobile } from '../hooks/useIsMobile'");
}

// Add hook
if (!content.includes("const isMobile = useIsMobile();")) {
  content = content.replace("export default function Home() {", "export default function Home() {\n  const isMobile = useIsMobile();");
}

// Make hero font responsive
content = content.replace("fontSize: '4.2rem'", "fontSize: isMobile ? '2.8rem' : '4.2rem'");
content = content.replace("fontSize: '1.25rem'", "fontSize: isMobile ? '1rem' : '1.25rem'");

// Make buttons responsive
content = content.replace("display: 'flex', gap: '16px', justifyContent: 'center'", "display: 'flex', gap: isMobile ? '12px' : '16px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row'");

// Reduce padding
content = content.replace(/padding: '120px 24px'/g, "padding: isMobile ? '80px 20px' : '120px 24px'");
content = content.replace(/padding: '100px 24px'/g, "padding: isMobile ? '60px 20px' : '100px 24px'");

// Card padding
content = content.replace(/padding: '32px'/g, "padding: isMobile ? '24px' : '32px'");

fs.writeFileSync('src/pages/Home.jsx', content);
