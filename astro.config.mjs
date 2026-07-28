// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://fpl0.io',
  integrations: [sitemap()],

  build: {
    // The whole stylesheet is ~2KB gzipped: inlining it removes the only
    // render-blocking request, so first paint needs just the HTML.
    inlineStylesheets: 'always',
  },

  // Self-hosted variable fonts, preloaded via <Font /> in BaseLayout.
  // The files in src/assets/fonts/ are the Fontsource `opsz` builds (the
  // remote Fontsource API strips the optical-size axis) instanced down to
  // the wght 400-700 range the CSS actually uses — 31% smaller, full opsz
  // kept. Regenerate with fontTools varLib.instancer if the design ever
  // needs weights outside 400-700.
  fonts: [
    {
      name: 'Source Serif 4',
      cssVariable: '--font-serif',
      provider: fontProviders.local(),
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      options: {
        variants: [
          {
            weight: '400 700',
            style: 'normal',
            src: ['./src/assets/fonts/source-serif-4-latin-opsz-normal.woff2'],
          },
          {
            weight: '400 700',
            style: 'italic',
            src: ['./src/assets/fonts/source-serif-4-latin-opsz-italic.woff2'],
          },
        ],
      },
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      provider: fontProviders.local(),
      fallbacks: ['ui-monospace', 'Menlo', 'monospace'],
      options: {
        variants: [
          {
            weight: '400 700',
            style: 'normal',
            src: ['./src/assets/fonts/jetbrains-mono-latin-wght-normal.woff2'],
          },
        ],
      },
    },
  ],

  markdown: {
    // smartypants (curly quotes, real em-dashes) and GFM are on by default.
    shikiConfig: {
      // github-* defaults chosen over vitesse for WCAG AA contrast on
      // punctuation/comment tokens in both modes.
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
    },
  },
});
