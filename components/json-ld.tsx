/**
 * The one sanctioned way to put schema.org on a page in the App Router: a
 * `<script type="application/ld+json">` the page renders itself.
 *
 * The type matters. A script with this type is data, not code — no browser
 * executes it — so React's dev warning about scripts inside components does not
 * describe a real loss here, and the site CSP's `script-src 'self'
 * 'unsafe-inline'` already covers the tag.
 *
 * `JSON.stringify` is what makes this safe to interpolate, but not on its own.
 * The values are the site's own dictionary and frontmatter, and a `</script>`
 * inside a post title would still close the tag early — an HTML parser does not
 * care that it sits inside a JSON string. Escaping `<` closes that off, and
 * costs nothing: `<` is the same character to a JSON parser.
 */
export function JsonLd({ data }: Readonly<{ data: object }>) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: A JSON-LD block has to be the script element's text content, and `json` is JSON-encoded above with `<` escaped.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
