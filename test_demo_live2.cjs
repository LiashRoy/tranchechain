const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://liashroy.github.io/tranchechain/#/demo', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  console.log("DOM LENGTH:", content.length);
  if (content.length < 1000) {
    console.log("DOM is small, might be a blank screen!");
  }
  
  await browser.close();
})();
