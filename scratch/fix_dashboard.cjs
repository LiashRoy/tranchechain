const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

if (!content.includes('useIsMobile')) {
  content = content.replace("import { ChevronRight, Database, Globe, Landmark, BookOpen, Settings } from 'lucide-react'", "import { ChevronRight, Database, Globe, Landmark, BookOpen, Settings } from 'lucide-react'\nimport { useIsMobile } from '../hooks/useIsMobile'");
  content = content.replace("export default function Dashboard() {", "export default function Dashboard() {\n  const isMobile = useIsMobile();");
  
  // Make minWidth 100% on mobile so that 320px doesn't break small screens (like 375px screens where padding + borders makes 320px too tight).
  content = content.replace(/minWidth: 320/g, "minWidth: isMobile ? '100%' : 320");
  
  // Reduce container padding
  content = content.replace(/padding: '28px 20px 60px'/g, "padding: isMobile ? '16px 12px 60px' : '28px 20px 60px'");
  
  fs.writeFileSync('src/pages/Dashboard.jsx', content);
}
