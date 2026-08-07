const fs = require('fs');
let c = fs.readFileSync('src/main.jsx', 'utf8');
c = c.replace("import { GlobalChainProvider } from './context/GlobalChainContext'", "import { GlobalChainProvider } from './context/GlobalChainContext'\nimport { ThemeProvider } from './context/ThemeContext'");
c = c.replace("<GlobalChainProvider>", "<ThemeProvider>\n    <GlobalChainProvider>");
c = c.replace("</GlobalChainProvider>", "</GlobalChainProvider>\n    </ThemeProvider>");
fs.writeFileSync('src/main.jsx', c);
