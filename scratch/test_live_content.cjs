const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('https://liashroy.github.io/tranchechain/', { waitUntil: 'networkidle2' });
  const content = await page.content();
  console.log('Contains Traditional Flow:', content.includes('Traditional Flow'));
  
  await browser.close();
})();
