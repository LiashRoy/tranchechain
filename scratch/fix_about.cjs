const fs = require('fs');

let content = fs.readFileSync('src/pages/About.jsx', 'utf8');

if (!content.includes('useIsMobile')) {
  content = content.replace("import { GraduationCap, Code, AlertTriangle, ShieldCheck, Banknote } from 'lucide-react'", "import { GraduationCap, Code, AlertTriangle, ShieldCheck, Banknote } from 'lucide-react'\nimport { useIsMobile } from '../hooks/useIsMobile'");
  content = content.replace("export default function About() {", "export default function About() {\n  const isMobile = useIsMobile();");
  
  // Make title responsive
  content = content.replace("fontSize: '3rem'", "fontSize: isMobile ? '2.2rem' : '3rem'");
  
  // Reduce container padding
  content = content.replace(/padding: '64px 24px 80px'/g, "padding: isMobile ? '40px 16px 60px' : '64px 24px 80px'");
  content = content.replace(/padding: '36px 32px'/g, "padding: isMobile ? '24px 20px' : '36px 32px'");
  content = content.replace(/padding: '28px 32px'/g, "padding: isMobile ? '20px 20px' : '28px 32px'");
  
  fs.writeFileSync('src/pages/About.jsx', content);
}
