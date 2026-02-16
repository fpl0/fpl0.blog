import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

async function generateFavicons() {
  const svgPath = join(process.cwd(), "public/favicon.svg");
  const publicDir = join(process.cwd(), "public");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const svgContent = readFileSync(svgPath, "utf-8");
  await page.setContent(`
    <style>
      body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
      svg { width: 100vw; height: 100vh; }
    </style>
    ${svgContent}
  `);

  const sizes = [
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "favicon-16x16.png", size: 16 },
  ];

  for (const { name, size } of sizes) {
    await page.setViewportSize({ width: size, height: size });
    await page.screenshot({
      path: join(publicDir, name),
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    console.log(`Generated ${name} (${size}x${size})`);
  }

  await browser.close();

  // Generate favicon.ico using sips (macOS)
  if (process.platform === "darwin") {
    try {
      const png32 = join(publicDir, "favicon-32x32.png");
      const ico = join(publicDir, "favicon.ico");
      execSync(`sips -s format ico "${png32}" --out "${ico}"`, { stdio: "inherit" });
      console.log("Generated favicon.ico (32x32)");
    } catch (error) {
      console.error("Failed to generate favicon.ico:", error);
    }
  }
}

generateFavicons().catch(console.error);
