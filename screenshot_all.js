'use strict';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--window-size=390,844'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  const shot = async (name, delay = 600) => {
    await page.waitForTimeout(delay);
    await page.screenshot({ path: `/home/user/dartfit/${name}.png` });
    console.log('✓', name);
  };

  // 1. Home screen
  await page.goto('http://localhost:3001');
  await shot('ui_01_home', 800);

  // 2. Auth screen
  await page.evaluate(() => navigate('auth'));
  await shot('ui_02_auth', 500);

  // 3. Skip auth, go to questionnaire
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(500);
  // Inject state to skip auth
  await page.evaluate(() => {
    // Navigate directly to questionnaire
    navigate('questionnaire');
  });
  await shot('ui_03_questionnaire', 600);

  // 4. Fill questionnaire and proceed
  await page.evaluate(() => {
    document.getElementById('q-height').value = '178';
    // Select middle grip
    document.querySelectorAll('[data-group="grip-pos"]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-val="middle"]').classList.add('active');
    // Select intermediate
    document.querySelectorAll('[data-group="level"]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-val="intermediate"]').classList.add('active');
  });
  await shot('ui_04_questionnaire_filled', 400);

  // 5. Go to scan screen
  await page.evaluate(() => { goToScan(); });
  await shot('ui_05_scan', 800);

  // 6. Skip scan, go to arm screen
  await page.evaluate(() => { skipScan(); });
  await shot('ui_06_arm_scan', 500);

  // 7. Skip arm, go to analyze
  await page.evaluate(() => { skipArm(); });
  await shot('ui_07_analyzing', 1200);

  // 8. Wait for results
  await page.waitForFunction(() => document.getElementById('screen-results')?.classList.contains('active'), { timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot('ui_08_results_top', 500);

  // 9. Scroll down results
  await page.evaluate(() => { document.getElementById('screen-results').scrollTop = 500; });
  await shot('ui_09_results_mid', 400);

  await page.evaluate(() => { document.getElementById('screen-results').scrollTop = 1000; });
  await shot('ui_10_results_bottom', 400);

  await page.evaluate(() => { document.getElementById('screen-results').scrollTop = 1600; });
  await shot('ui_11_results_tiers', 400);

  await page.evaluate(() => { document.getElementById('screen-results').scrollTop = 2400; });
  await shot('ui_12_results_alternates', 400);

  await browser.close();
  console.log('\nAll screenshots saved.');
})().catch(e => { console.error(e); process.exit(1); });
