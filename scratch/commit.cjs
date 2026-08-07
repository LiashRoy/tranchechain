const { execSync } = require('child_process');
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "pre-light-mode refactor"', { stdio: 'inherit' });
