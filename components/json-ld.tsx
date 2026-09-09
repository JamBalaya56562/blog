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
