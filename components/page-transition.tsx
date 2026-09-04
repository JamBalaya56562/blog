import type React from "react"
import { ViewTransition } from "react"

/**
 * Directional page wrapper. Maps the `nav-forward` / `nav-back` transition
 * types that `<Link transitionTypes={...}>` carries onto the
 * `view-transition-class` that the `::view-transition-old(.nav-forward)`
 * family in `app/globals.css` selects on. Those rules have been in the
 * stylesheet since the redesign but never fired, because nothing supplied
 * a transition type or an enter/exit map.
 *
 * Two rules this component exists to hold in one place:
 *
 *  - It belongs in a `page.tsx`, never in `app/[locale]/layout.tsx`.
 *    Layouts persist across navigations, so `enter` / `exit` never fire
 *    there. Keeping it out of the layout is also what leaves the header,
 *    footer and background out of the slide.
 *  - It must NOT take a `name`. Without one, React generates a unique name
 *    per instance, so the outgoing and incoming pages are an exit/enter
 *    pair. Give both sides the same name and React pairs them into a
 *    `share` morph instead, and the slide silently stops.
 *
 * `default: "none"` keeps untyped transitions — browser back/forward,
 * `router.refresh()`, Suspense reveals — from sliding in an arbitrary
 * direction. Same-route navigations (pagination, tag filters) reconcile as
 * an update rather than an enter/exit pair, so tagging those links would
 * have no effect; they are deliberately left untyped.
 */
export function PageTransition({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransition
      default="none"
      enter={{
        default: "none",
        "nav-back": "nav-back",
        "nav-forward": "nav-forward",
      }}
      exit={{
        default: "none",
        "nav-back": "nav-back",
        "nav-forward": "nav-forward",
      }}
    >
      {children}
    </ViewTransition>
  )
}
