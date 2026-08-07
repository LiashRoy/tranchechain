const { execSync } = require('child_process');
try {
  execSync('git add docs', { stdio: 'inherit' });
  execSync('git commit -m "docs folder"', { stdio: 'inherit' });
  execSync('git push origin master', { stdio: 'inherit' });
} catch (e) {}
