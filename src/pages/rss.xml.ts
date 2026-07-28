import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context: APIContext) {
  // Unlike the pages, the feed never includes drafts — not even in dev.
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const site = context.site!; // `site` is set in astro.config.mjs
  const self = new URL('rss.xml', site);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
    })),
    customData: `<language>en</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
  });
}
