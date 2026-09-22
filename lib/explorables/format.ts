/**
 * Fills `{name}` placeholders in a sentence written in the article.
 *
 * The figures describe their state in a line of prose, and that prose belongs
 * to the article, in the article's language: the MDX hands over a template and
 * the figure supplies the numbers. A placeholder with no value is left as it
 * was, so a typo in the template shows up on the page rather than as an empty
 * gap.
 */
export function fill(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  )
}

/**
 * A duration the way a build log would round it: `4s`, `5m 30s`, `8m`.
 *
 * Whole seconds only. The figures add up step durations that the articles
 * quote to the second, and a decimal here would claim a precision the source
 * never had.
 */
export function formatSeconds(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  if (minutes === 0) {
    return `${rest}s`
  }
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`
}
