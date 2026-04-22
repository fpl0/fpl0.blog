/**
 * Generate a beautiful PDF of the Self-Directed MSc curriculum.
 *
 * Usage:
 *   1. Start the dev server in another terminal: `bun run dev`
 *   2. Run: `bun run 0:msc-pdf`
 *
 * The PDF is written to `public/msc-curriculum.pdf` and served at
 * `/msc-curriculum.pdf` — the "Download PDF" link on the app page.
 *
 * The script emulates print media so the @media print block in msc.css drives
 * the layout. Background colors are preserved so the heatmap and progress
 * ring render as on-screen.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

import { error, heading, info, success } from "./fmt";

const DEV_URL = "http://localhost:4321/apps/msc-cogsci/";

async function checkDevServer(): Promise<boolean> {
  try {
    const res = await fetch(DEV_URL, { redirect: "manual" });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

async function generatePdf(): Promise<void> {
  heading("Generate MSc PDF");

  if (!(await checkDevServer())) {
    error(`Dev server is not reachable at ${DEV_URL}`);
    info("Start it in another terminal first: bun run dev");
    process.exit(1);
  }

  const publicDir = join(process.cwd(), "public");
  if (!existsSync(publicDir)) {
    error(`public/ directory is missing at ${publicDir}`);
    process.exit(1);
  }

  const outPath = join(publicDir, "msc-curriculum.pdf");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    // Emulate print — the @media print block in msc.css takes over.
    await page.emulateMedia({ media: "print" });

    // Flag the html so supplementary PDF-only rules can pick it up too.
    await page.addInitScript(() => {
      document.documentElement.setAttribute("data-pdf-export", "true");
    });

    info(`Navigating to ${DEV_URL}…`);
    await page.goto(DEV_URL, { waitUntil: "networkidle" });

    // Force light theme for print (the curriculum is a paper-like document).
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });

    // Let webfonts settle.
    await page.waitForFunction(() => document.fonts.ready.then(() => true));

    info("Rendering PDF…");
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "16mm",
        right: "14mm",
        bottom: "16mm",
        left: "14mm",
      },
    });

    success(`Wrote ${outPath}`);
  } finally {
    await browser.close();
  }
}

generatePdf().catch((err) => {
  console.error(err);
  process.exit(1);
});
