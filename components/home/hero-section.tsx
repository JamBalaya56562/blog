import type { Route } from "next"
import Link from "next/link"
import { CountUp } from "@/components/ui/count-up"
import { SplitText } from "@/components/ui/split-text"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { estimateHeadlineEm, estimateLongestWordEm } from "@/lib/typography"

interface HeroSectionProps {
  readonly locale: Locale
  readonly dictionary: Dictionary
  readonly postCount: number
  readonly tagCount: number
  readonly latestDate?: string
}

/**
 * Minimal hero — big typography + a small HUD strip beneath, fed by real
 * blog metrics (post count, tag count, latest publication date, total
 * estimated reading time). No fictional sci-fi counters.
 *
 * The all-caps HUD labels are hardcoded English on purpose — they are part
 * of the cyberpunk visual signature (uppercase mono typography), like a
 * Japanese sci-fi game UI. The translatable text (top tick + section titles
 * + body copy) flows through `dictionary`.
 */
export function HeroSection({
  locale,
  dictionary,
  postCount,
  tagCount,
  latestDate,
}: Readonly<HeroSectionProps>) {
  // Both lines share one size, taken from whichever is wider, so the headline
  // reads as a single block. `.pp-hero-line` divides the container width by
  // this to land on a size that always fits on one line.
  const headlineEm = Math.max(
    estimateHeadlineEm(dictionary.home.title),
    estimateHeadlineEm(dictionary.home.titleAccent),
  )
  // Governs the size below the breakpoint, where the line is allowed to wrap.
  const headlineWordEm = Math.max(
    estimateLongestWordEm(dictionary.home.title),
    estimateLongestWordEm(dictionary.home.titleAccent),
  )

  return (
    <section className="relative overflow-hidden px-7 pb-12 pt-16 sm:pt-24">
      <h1
        className="pp-display pp-hero-title m-0 leading-[0.95]"
        style={
          {
            "--pp-headline-em": headlineEm,
            "--pp-headline-word-em": headlineWordEm,
          } as React.CSSProperties
        }
      >
        <span className="pp-hero-line text-foreground">
          <SplitText text={dictionary.home.title} stagger={40} />
        </span>
        <span className="pp-hero-line text-cyber-cyan">
          <SplitText
            text={dictionary.home.titleAccent}
            delay={400}
            stagger={40}
          />
        </span>
      </h1>

      {/* Wide enough for the longest subtitle to hold one line. In English it
          needs 672px; the previous 36rem cap wrapped it even on a 1440px
          screen. Japanese was never affected, since full-width characters put
          the same sentence at 451px. Narrow screens are bounded by the section
          padding long before this cap, so they still wrap. */}
      <p className="mt-8 max-w-3xl font-mono text-sm leading-[1.8] text-cyber-dim">
        <span className="mr-1 text-cyber-cyan">&gt;</span>
        {dictionary.home.subtitle}
        <br />
        <span className="mr-1 text-cyber-cyan">&gt;</span>
        {dictionary.home.subtitleSecond}
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/blog` as Route}
          transitionTypes={["nav-forward"]}
          className="pp-btn"
        >
          <span>◢ {dictionary.home.ctaBrowse}</span>
        </Link>
        <Link
          href={`/${locale}/portfolio` as Route}
          transitionTypes={["nav-forward"]}
          className="pp-btn pp-btn-amber"
        >
          <span>◢ {dictionary.footer.portfolio}</span>
        </Link>
      </div>

      {/* HUD readout strip — real blog metrics, no fictional values.
          Mobile: 2-up POSTS|TAGS, then LATEST as a full-width row beneath
          (compact, no horizontal overflow on the date). Desktop: 3-up. */}
      <div className="mt-14 grid grid-cols-2 gap-0 border-t border-cyber-line md:grid-cols-3">
        <HudCell
          label="POSTS"
          value={
            <CountUp
              target={postCount}
              className="pp-display text-cyber-cyan"
            />
          }
          sub="PUBLISHED"
          dotColor="lime"
          wrapperClass="border-b border-r border-cyber-line md:border-b-0"
        />
        <HudCell
          label="TAGS"
          value={
            <CountUp target={tagCount} className="pp-display text-cyber-cyan" />
          }
          sub="UNIQUE"
          dotColor="amber"
          wrapperClass="border-b border-cyber-line md:border-b-0 md:border-r"
        />
        <HudCell
          label="LATEST"
          value={
            <span className="pp-display text-cyber-cyan">
              {latestDate?.replace(/-/g, ".") ?? "----.--.--"}
            </span>
          }
          sub="POST DATE"
          dotColor="amber"
          wrapperClass="col-span-2 md:col-span-1"
        />
      </div>
    </section>
  )
}

function HudCell({
  label,
  value,
  sub,
  dotColor,
  wrapperClass = "",
}: {
  readonly label: string
  readonly value: React.ReactNode
  readonly sub: string
  readonly dotColor: "lime" | "amber"
  /** Per-cell border / span classes; the parent grid decides which edges
   *  each cell needs at each breakpoint. */
  readonly wrapperClass?: string
}) {
  const dotClass = dotColor === "lime" ? "bg-cyber-lime" : "bg-cyber-amber"
  return (
    <div className={`relative p-5 ${wrapperClass}`}>
      <div className="pp-tick">{label}</div>
      <div className="mt-1.5 text-2xl">{value}</div>
      <div className="pp-tick mt-1 text-[9px] text-cyber-dimmer">{sub}</div>
      <span
        className={`pp-pulse absolute right-3 top-3 inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}
      />
    </div>
  )
}
