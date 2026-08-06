const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5174/tranchechain/#/demo', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Clicking Break It tab...');
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button');
    for (const t of tabs) {
      if (t.innerText && t.innerText.includes('Break It')) {
        t.click();
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
