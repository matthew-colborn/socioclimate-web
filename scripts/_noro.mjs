import p from 'puppeteer-core';
const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args:['--autoplay-policy=no-user-gesture-required'] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await pg.goto('http://localhost:4332/', { waitUntil: 'networkidle0' });
await new Promise(r=>setTimeout(r,2000));
for (const i of [1,2,3]) {
  await pg.evaluate((n)=>document.querySelectorAll('[data-goto]')[n].click(), i);
  await new Promise(r=>setTimeout(r,2000));
  await pg.screenshot({ path: 'screenshots/noro-scene'+(i+1)+'.png' });
}
await b.close();
