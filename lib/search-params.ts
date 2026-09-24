/**
 * A query parameter as a page receives it: absent, once, or repeated. Next
 * hands a repeated key over as an array, so `?q=a&q=b` is `["a", "b"]`, and
 * nothing in the URL a reader types can rule that out.
 */
export type SearchParamValue = string | string[] | undefined

export type SearchParams = Record<string, SearchParamValue>

/**
 * The first value of a parameter, which is what `URLSearchParams.get` returns
 * and so what the search box and the sort select read on the client. The
 * server settling on the same one keeps the two agreeing on a repeated key.
 */
export function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
