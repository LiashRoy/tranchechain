const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
if (!c.includes('ThemeProvider')) {
  c = c.replace("import { GlobalChainProvider } from './context/GlobalChainContext'", "import { GlobalChainProvider } from './context/GlobalChainContext'\nimport { ThemeProvider } from './context/ThemeContext'");
  c = c.replace("<GlobalChainProvider>", "<ThemeProvider>\n      <GlobalChainProvider>");
  c = c.replace("</GlobalChainProvider>", "</GlobalChainProvider>\n    </ThemeProvider>");
  fs.writeFileSync('src/App.jsx', c);
  console.log('App.jsx updated');
} else {
  console.log('App.jsx already has ThemeProvider');
}
