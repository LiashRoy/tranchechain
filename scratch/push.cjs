const { execSync } = require('child_process');
try {
  execSync('git commit -m "push"', { stdio: 'inherit' });
  execSync('git push origin master', { stdio: 'inherit' });
} catch (e) {}
