const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/tranchechain/demo#tamper', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button');
    for (const t of tabs) {
      if (t.innerText && t.innerText.includes('Break It')) {
        t.click();
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  console.log("DOM LENGTH:", content.length);
  if (content.length < 1000) {
    console.log("DOM is small, might be a blank screen!");
  }
  
  await browser.close();
})();
