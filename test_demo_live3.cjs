const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://LiashRoy.github.io/tranchechain/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Navigating to demo...');
  await page.goto('https://LiashRoy.github.io/tranchechain/#/demo', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Navigating to tamper...');
  await page.goto('https://LiashRoy.github.io/tranchechain/#/demo#tamper', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
