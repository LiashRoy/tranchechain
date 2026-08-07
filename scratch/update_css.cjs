const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// The new CSS variables structure
const newCss = `
:root {
  /* LIGHT MODE (Default unless overridden by .dark) */
  --bg-body: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(15, 23, 42, 0.1);
  --glass-shadow: rgba(0, 0, 0, 0.05);

  --scrollbar-track: #f1f5f9;
  --scrollbar-thumb: #cbd5e1;
  --scrollbar-hover: #94a3b8;

  --nav-bg: rgba(255, 255, 255, 0.7);
  --nav-border: rgba(15, 23, 42, 0.1);

  /* Semantic Colors (Maintained across modes for consistency) */
  --color-electric-blue: #3b8cff;
  --color-teal: #14b8a6;
  --color-red: #ef4444;
  --color-gold: #f59e0b;
  --color-green: #10b981;

  --badge-blue-bg: rgba(59, 140, 255, 0.15);
  --badge-blue-text: #2563eb;
  --badge-blue-border: rgba(59, 140, 255, 0.3);

  --badge-red-bg: rgba(239, 68, 68, 0.15);
  --badge-red-text: #dc2626;
  --badge-red-border: rgba(239, 68, 68, 0.3);

  --badge-teal-bg: rgba(20, 184, 166, 0.15);
  --badge-teal-text: #0d9488;
  --badge-teal-border: rgba(20, 184, 166, 0.3);

  --bg-grid-line: rgba(15, 23, 42, 0.06);

  --btn-ghost-text: #475569;
  --btn-ghost-border: rgba(15, 23, 42, 0.15);
  --btn-ghost-hover-bg: rgba(15, 23, 42, 0.05);
  --btn-ghost-hover-text: #0f172a;
  --btn-ghost-hover-border: rgba(15, 23, 42, 0.25);
  
  --dropdown-bg: #ffffff;
  --dropdown-text: #0f172a;
}

html.dark {
  /* DARK MODE */
  --bg-body: #0B1220;
  --text-primary: #d4e0ef;
  --text-secondary: #7a8fb0;
  
  --glass-bg: rgba(15, 26, 46, 0.6);
  --glass-border: rgba(59, 140, 255, 0.12);
  --glass-shadow: rgba(59, 140, 255, 0.08);

  --scrollbar-track: #0B1220;
  --scrollbar-thumb: #243352;
  --scrollbar-hover: #3b8cff;

  --nav-bg: rgba(11, 18, 32, 0.65);
  --nav-border: rgba(59, 140, 255, 0.15);

  --badge-blue-bg: rgba(59, 140, 255, 0.12);
  --badge-blue-text: #6aaeff;
  --badge-blue-border: rgba(59, 140, 255, 0.25);

  --badge-red-bg: rgba(239, 68, 68, 0.12);
  --badge-red-text: #f87171;
  --badge-red-border: rgba(239, 68, 68, 0.25);

  --badge-teal-bg: rgba(20, 184, 166, 0.12);
  --badge-teal-text: #2dd4bf;
  --badge-teal-border: rgba(20, 184, 166, 0.25);

  --bg-grid-line: rgba(59, 140, 255, 0.04);

  --btn-ghost-text: #9badc8;
  --btn-ghost-border: rgba(59, 140, 255, 0.2);
  --btn-ghost-hover-bg: rgba(59, 140, 255, 0.06);
  --btn-ghost-hover-text: #d4e0ef;
  --btn-ghost-hover-border: rgba(59, 140, 255, 0.5);

  --dropdown-bg: #0f172a;
  --dropdown-text: #d4e0ef;
}
`;

css = css.replace(/body \{[\s\S]*?\}/, "body {\n  margin: 0;\n  padding: 0;\n  font-family: var(--font-sans);\n  background-color: var(--bg-body);\n  color: var(--text-primary);\n  min-height: 100vh;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  transition: background-color 0.3s ease, color 0.3s ease;\n}");

css = css.replace(/::-webkit-scrollbar-track \{[\s\S]*?\}/, "::-webkit-scrollbar-track {\n  background: var(--scrollbar-track);\n}");
css = css.replace(/::-webkit-scrollbar-thumb \{[\s\S]*?\}/, "::-webkit-scrollbar-thumb {\n  background: var(--scrollbar-thumb);\n  border-radius: 999px;\n}");
css = css.replace(/::-webkit-scrollbar-thumb:hover \{[\s\S]*?\}/, "::-webkit-scrollbar-thumb:hover {\n  background: var(--scrollbar-hover);\n}");

css = css.replace(/\.glass-card \{[\s\S]*?\}/, ".glass-card {\n  background: var(--glass-bg);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid var(--glass-border);\n  border-radius: 14px;\n  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;\n  transform: translateZ(0);\n  will-change: transform, backdrop-filter;\n  backface-visibility: hidden;\n}");

css = css.replace(/\.glass-card:hover \{[\s\S]*?\}/, ".glass-card:hover {\n  border-color: rgba(59, 140, 255, 0.3);\n  box-shadow: 0 0 32px var(--glass-shadow);\n}");

css = css.replace(/\.bg-grid \{[\s\S]*?\}/, ".bg-grid {\n  background-image:\n    linear-gradient(var(--bg-grid-line) 1px, transparent 1px),\n    linear-gradient(90deg, var(--bg-grid-line) 1px, transparent 1px);\n  background-size: 48px 48px;\n}");

css = css.replace(/\.btn-ghost \{[\s\S]*?\}/, ".btn-ghost {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 22px;\n  background: transparent;\n  color: var(--btn-ghost-text);\n  font-family: var(--font-sans);\n  font-weight: 500;\n  font-size: 0.875rem;\n  border: 1px solid var(--btn-ghost-border);\n  border-radius: 10px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  text-decoration: none;\n}");

css = css.replace(/\.btn-ghost:hover \{[\s\S]*?\}/, ".btn-ghost:hover {\n  color: var(--btn-ghost-hover-text);\n  border-color: var(--btn-ghost-hover-border);\n  background: var(--btn-ghost-hover-bg);\n}");

css = css.replace(/\.badge-blue \{[\s\S]*?\}/, ".badge-blue { background: var(--badge-blue-bg); color: var(--badge-blue-text); border: 1px solid var(--badge-blue-border); }");
css = css.replace(/\.badge-teal \{[\s\S]*?\}/, ".badge-teal { background: var(--badge-teal-bg); color: var(--badge-teal-text); border: 1px solid var(--badge-teal-border); }");
css = css.replace(/\.badge-red \{[\s\S]*?\}/, ".badge-red { background: var(--badge-red-bg); color: var(--badge-red-text); border: 1px solid var(--badge-red-border); }");

css = css.replace(/option \{[\s\S]*?\}/, "option {\n  background-color: var(--dropdown-bg);\n  color: var(--dropdown-text);\n}");

// Insert the new variables block right after the generic color block
css = css.replace(/--radius-pill: 999px;\n}/, "--radius-pill: 999px;\n}\n\n" + newCss);

fs.writeFileSync('src/index.css', css);
