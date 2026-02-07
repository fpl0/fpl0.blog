import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";

export async function GET(context: APIContext) {
  const posts = await getCollection("blog", ({ data }) => !data.isDraft);

  const sortedPosts = posts.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  // Render full content for each post
  const items = await Promise.all(
    sortedPosts.map(async (post) => {
      // Convert markdown to HTML for RSS feed
      const htmlContent = post.body ? await marked.parse(post.body) : "";

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.summary,
        content: sanitizeHtml(htmlContent, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),
        link: `/blog/${post.slug}/`,

      };
    })
  );

  return rss({
    title: "fpl0",
    description: "True delight is in the finding out rather than in the knowing.",
    site: context.site ?? "https://fpl0.github.io",
    items,
    customData: `<language>en-us</language>`,
  });
}
