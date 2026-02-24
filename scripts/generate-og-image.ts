import { readFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

async function generateOgImage() {
  const publicDir = join(process.cwd(), "public");
  const fontPath = join(
    process.cwd(),
    "node_modules/@fontsource/merriweather/files/merriweather-latin-300-normal.woff2",
  );
  const fontData = readFileSync(fontPath).toString("base64");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 630 });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @font-face {
          font-family: 'Merriweather';
          font-weight: 300;
          font-style: normal;
          src: url(data:font/woff2;base64,${fontData}) format('woff2');
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1200px;
          height: 630px;
          background: oklch(0.97 0.015 85);
          font-family: 'Merriweather', serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        /* Subtle grain texture */
        body::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .wordmark {
          font-size: 96px;
          font-weight: 300;
          color: oklch(0.25 0.04 55);
          letter-spacing: -2px;
          margin-bottom: 24px;
        }
        .tagline {
          font-size: 28px;
          font-weight: 300;
          color: oklch(0.45 0.03 55);
          letter-spacing: 0.5px;
        }
        .border-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: oklch(0.55 0.12 55);
        }
      </style>
    </head>
    <body>
      <div class="wordmark">fpl0</div>
      <div class="tagline">writing, code, and other curiosities</div>
      <div class="border-line"></div>
    </body>
    </html>
  `);

  await page.screenshot({
    path: join(publicDir, "og-default.png"),
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  console.log("Generated og-default.png (1200x630)");
  await browser.close();
}

generateOgImage().catch(console.error);
