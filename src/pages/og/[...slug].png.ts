import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../lib/og-image';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  
  return [
    // Homepage OG image
    {
      params: { slug: 'home' },
      props: { title: SITE_DESCRIPTION, isHome: true },
    },
    // Per-post OG images
    ...posts.map((post) => ({
      params: { slug: `post/${post.id}` },
      props: { title: post.data.title, isHome: false },
    })),
  ];
}

export const GET: APIRoute = async ({ props }) => {
  const { title, isHome } = props as { title: string; isHome: boolean };
  const png = await generateOgImage(title, isHome);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
