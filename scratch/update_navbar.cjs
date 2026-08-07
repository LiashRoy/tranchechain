const fs = require('fs');
let c = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

if (!c.includes('useTheme')) {
  c = c.replace("import { NavLink, useLocation } from 'react-router-dom'", "import { NavLink, useLocation } from 'react-router-dom'\nimport { useTheme } from '../context/ThemeContext'\nimport { Sun, Moon } from 'lucide-react'");
}

c = c.replace("export default function Navbar() {", "export default function Navbar() {\n  const { theme, toggleTheme } = useTheme();");

const toggleBtn = `
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
`;

c = c.replace("{/* Mobile hamburger */}", toggleBtn + "\n          {/* Mobile hamburger */}");

c = c.replace("background: scrolled\n            ? 'rgba(15,23,42,0.65)'\n            : 'rgba(15,23,42,0.2)'", "background: scrolled ? 'var(--nav-bg)' : 'transparent'");
c = c.replace("borderBottom: scrolled\n            ? '1px solid rgba(37,99,235,0.15)'\n            : '1px solid rgba(37,99,235,0.06)'", "borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid transparent'");
c = c.replace("background: 'linear-gradient(135deg, #1e40af, #3b82f6)'", "background: 'var(--color-electric-blue)'");
c = c.replace("background: 'linear-gradient(135deg, #f8fafc 30%, #94a3b8)'", "background: 'var(--text-primary)'");
c = c.replace("color: isActive ? '#f8fafc' : '#94a3b8'", "color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'");
c = c.replace("background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent'", "background: isActive ? 'var(--badge-blue-bg)' : 'transparent'");
c = c.replace("border: isActive ? '1px solid rgba(37,99,235,0.22)' : '1px solid transparent'", "border: isActive ? '1px solid var(--badge-blue-border)' : '1px solid transparent'");

fs.writeFileSync('src/components/Navbar.jsx', c);
