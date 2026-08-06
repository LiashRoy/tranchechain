const fs = require('fs');

let content = fs.readFileSync('src/pages/HowItWorks.jsx', 'utf8');

if (!content.includes('useIsMobile')) {
  content = content.replace("import { motion, AnimatePresence } from 'framer-motion'", "import { motion, AnimatePresence } from 'framer-motion'\nimport { useIsMobile } from '../hooks/useIsMobile'");
  content = content.replace("export default function HowItWorks() {", "export default function HowItWorks() {\n  const isMobile = useIsMobile();");
  
  // Make title responsive
  content = content.replace("fontSize: 'clamp(2rem, 4vw, 3.2rem)'", "fontSize: isMobile ? '2.2rem' : 'clamp(2rem, 4vw, 3.2rem)'");
  
  // Reduce container padding
  content = content.replace(/padding: '100px 24px 80px'/g, "padding: isMobile ? '60px 16px 40px' : '100px 24px 80px'");
  content = content.replace(/padding: '32px 28px'/g, "padding: isMobile ? '24px 20px' : '32px 28px'");
  content = content.replace(/padding: '72px 24px 0'/g, "padding: isMobile ? '40px 16px 0' : '72px 24px 0'");
  
  // Fix flex directions
  content = content.replace(/flexDirection: 'row'/g, "flexDirection: isMobile ? 'column' : 'row'");
  
  fs.writeFileSync('src/pages/HowItWorks.jsx', content);
}
