<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="/rss/channel/title"/> – RSS Feed</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            max-width: 42rem;
            margin: 0 auto;
            padding: 2rem 1.25rem;
            color: #16161a;
            background: #fbfbf9;
          }
          @media (prefers-color-scheme: dark) {
            body { color: #e2e0db; background: #16161a; }
            a { color: #8fb1ea; }
          }
          h1 { font-size: 2rem; margin: 0 0 0.5rem; }
          .subtitle { color: #6d6a72; font-size: 0.95rem; margin: 0 0 2rem; }
          .info { 
            background: #f3f1ec;
            border: 1px solid #e5e2dc;
            border-radius: 6px;
            padding: 1rem 1.25rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
          }
          @media (prefers-color-scheme: dark) {
            .info { background: #1e1e24; border-color: #2b2b31; }
          }
          .item { margin-bottom: 2.5rem; }
          .item h2 { margin: 0 0 0.35rem; font-size: 1.3rem; }
          .item h2 a { color: inherit; text-decoration: none; }
          .item h2 a:hover { color: #24509b; }
          @media (prefers-color-scheme: dark) {
            .item h2 a:hover { color: #8fb1ea; }
          }
          .meta { font-size: 0.85rem; color: #6d6a72; margin: 0 0 0.5rem; }
          .description { color: #6d6a72; margin: 0; }
        </style>
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="subtitle"><xsl:value-of select="/rss/channel/description"/></p>
          <div class="info">
            <strong>This is an RSS feed.</strong> Subscribe by copying the URL into your feed reader.
            Visit <a href="https://aboutfeeds.com">About Feeds</a> to learn more.
          </div>
        </header>
        <main>
          <xsl:for-each select="/rss/channel/item">
            <article class="item">
              <h2>
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="link"/>
                  </xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <p class="meta">
                <xsl:value-of select="pubDate"/>
              </p>
              <p class="description">
                <xsl:value-of select="description"/>
              </p>
            </article>
          </xsl:for-each>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
