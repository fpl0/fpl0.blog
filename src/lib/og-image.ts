import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { SITE_TITLE } from '../consts';

// Cache for font data
let sourceSerifRegular: ArrayBuffer | undefined;
let jetBrainsMonoBold: ArrayBuffer | undefined;

async function loadFonts() {
  if (!sourceSerifRegular) {
    // Load from node_modules or use system fonts as fallback
    try {
      sourceSerifRegular = await readFile(
        'node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff'
      );
    } catch {
      // Fallback: will use default font
      sourceSerifRegular = new ArrayBuffer(0);
    }
  }
  if (!jetBrainsMonoBold) {
    try {
      jetBrainsMonoBold = await readFile(
        'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff'
      );
    } catch {
      jetBrainsMonoBold = new ArrayBuffer(0);
    }
  }
}

export async function generateOgImage(title: string, isHome = false): Promise<Uint8Array> {
  await loadFonts();

  const width = 1200;
  const height = 630;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#16161a',
          padding: '80px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 64,
                fontWeight: 600,
                color: '#e2e0db',
                lineHeight: 1.2,
                marginBottom: 40,
                maxWidth: '90%',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 36,
                fontWeight: 700,
                color: '#e2e0db',
              },
              children: [
                {
                  type: 'span',
                  props: {
                    children: SITE_TITLE,
                  },
                },
                {
                  type: 'span',
                  props: {
                    style: { color: '#8fb1ea' },
                    children: '.',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width,
      height,
      fonts: [
        {
          name: 'Source Serif',
          data: sourceSerifRegular!,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'JetBrains Mono',
          data: jetBrainsMonoBold!,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}
