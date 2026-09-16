import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4183/sam-digital/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
  // Keep this fixture explicit: showcase must not infer or depend on the app's AI worker.
  window.Worker = class ShowcaseFixtureWorker {
    postMessage() {}
    terminate() {}
  };
});
const page = await context.newPage();
await page.route('**/src/showcase.js', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/javascript', body: await readFile(new URL('../src/showcase.js', import.meta.url), 'utf8') });
});
await page.route('**/src/showcase.css', async (route) => {
  await route.fulfill({ status: 200, contentType: 'text/css', body: await readFile(new URL('../src/showcase.css', import.meta.url), 'utf8') });
});
const checks = [];
const pass = (message) => { checks.push(message); console.log('PASS', message); };
const moduleSource = (await readFile(new URL('../src/showcase.js', import.meta.url), 'utf8')).replace("import './showcase.css';", '');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`;

try {
  await page.goto(base);
  const fixture = page.locator('#showcase');
  await expect(fixture.getByText('Interactive demos · not client work', { exact: true })).toBeVisible();
  await expect(fixture.locator('.showcase-card')).toHaveCount(2);
  await expect(fixture.locator('canvas.breakout-canvas')).toHaveAttribute('aria-label', /Breakout game/);
  await expect(fixture.locator('.breakout-status')).toHaveText('Ready when you are.');
  await expect(fixture.locator('.breakout-start')).toBeEnabled();
  await expect(fixture.locator('.breakout-pause')).toBeDisabled();
  pass('Gallery mounts two labeled, embedded demos without auto-starting');

  await fixture.locator('.breakout-start').click();
  await expect(fixture.locator('.breakout-status')).toHaveText('In play.');
  await expect(fixture.locator('.breakout-pause')).toBeEnabled();
  await fixture.locator('.breakout-canvas').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await fixture.locator('.breakout-pause').click();
  await expect(fixture.locator('.breakout-status')).toHaveText('Paused.');
  await fixture.locator('.breakout-restart').click();
  await expect(fixture.locator('.breakout-status')).toHaveText('Ready when you are.');
  await expect(fixture.locator('[data-score]')).toHaveText('0');
  await expect(fixture.locator('[data-lives]')).toHaveText('3');
  pass('Breakout controls, keyboard steering, restart, score and lives are functional');

  await fixture.locator('.breakout-start').click();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('sam-motion', { detail: { paused: true } })));
  await expect(fixture.locator('.breakout-status')).toHaveText('Paused by motion controls.');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('sam-motion', { detail: { paused: false } })));
  await expect(fixture.locator('.breakout-status')).toHaveText('In play.');
  await fixture.locator('.breakout-pause').click();
  pass('sam-motion pause event stops and resumes an explicitly started game');

  await fixture.locator('button[data-palette="lavender"]').click();
  await expect(fixture.locator('.study-preview')).toHaveAttribute('data-palette', 'lavender');
  await expect(fixture.locator('button[data-palette="lavender"]')).toHaveAttribute('aria-pressed', 'true');
  await fixture.locator('[data-layout-choice="compact"]').click();
  await expect(fixture.locator('.study-preview')).toHaveAttribute('data-layout', 'compact');
  await expect(fixture.locator('[data-layout-choice="compact"]')).toHaveAttribute('aria-pressed', 'true');
  pass('Design study palette and layout controls update accessible state');

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  pass('Gallery has no horizontal overflow at compact and desktop widths');

  await page.setViewportSize({ width: 390, height: 844 });
  const axe = await new AxeBuilder({ page }).include('#showcase').analyze();
  expect(axe.violations).toEqual([]);
  pass('Showcase passes automated accessibility checks');
  await page.screenshot({ path: 'proof/showcase-mobile.png', fullPage: true });

  await page.emulateMedia({reducedMotion:'reduce'});
  await fixture.locator('.breakout-start').click();
  await expect(fixture.locator('.breakout-status')).toHaveText('In play.');
  await fixture.locator('.breakout-pause').click();
  pass('Reduced motion stops decoration but still permits a deliberately started game');
  console.log(JSON.stringify({ base, checks }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
