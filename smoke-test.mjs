import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const screenshotsDir = '/tmp/photosaviour-screenshots';
fs.mkdirSync(screenshotsDir, { recursive: true });

// Landing page
await page.goto('http://localhost:5173');
await page.waitForSelector('h1', { timeout: 15000 });
await page.screenshot({ path: path.join(screenshotsDir, '1-landing.png'), fullPage: true });
console.log('✓ Landing page loaded');

// Navigate to projects
await page.click('text=Ver Projetos');
await page.waitForSelector('text=Meus Projetos');
await page.screenshot({ path: path.join(screenshotsDir, '2-projects.png'), fullPage: true });
console.log('✓ Projects page loaded');

// Create a project -> editor
await page.click('text=Criar Projeto');
await page.waitForSelector('text=Projetos', { timeout: 5000 });
await page.screenshot({ path: path.join(screenshotsDir, '3-editor.png'), fullPage: true });
console.log('✓ Editor page loaded');

// Check console errors
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await browser.close();

if (errors.length > 0) {
  console.error('Console errors:', errors);
  process.exit(1);
}
console.log('✓ No console errors');
