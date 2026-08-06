const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('https://liashroy.github.io/tranchechain/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Demo link...');
  await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const l of links) {
      if (l.innerText && l.innerText.includes('Live Demo')) {
        l.click();
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  
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
