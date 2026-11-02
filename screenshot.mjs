import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage: node screenshot.mjs <url> [label]
const [url = 'http://localhost:3000', label] = process.argv.slice(2);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, 'temporary screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Next free index across all screenshot-N*.png files, so nothing is overwritten
const used = fs.readdirSync(OUT_DIR)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const n = used.length ? Math.max(...used) + 1 : 1;
const fileName = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath = path.join(OUT_DIR, fileName);

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts?.ready);
  // Give the Tailwind CDN and entrance animations time to settle
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved ${path.relative(ROOT, outPath)}`);
} finally {
  await browser.close();
}
