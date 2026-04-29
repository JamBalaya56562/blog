import type { Route } from "next"
import Link from "next/link"
import { CountUp } from "@/components/ui/count-up"
import { SplitText } from "@/components/ui/split-text"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

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
  return (
    <section className="relative overflow-hidden px-7 pb-12 pt-16 sm:pt-24">
      <h1 className="pp-display m-0 text-[clamp(40px,8vw,96px)] font-extrabold leading-[0.95] tracking-tight">
        <span className="block text-foreground">
          <SplitText text={dictionary.home.title} stagger={40} />
        </span>
        <span className="block text-cyber-cyan">
          <SplitText
            text={dictionary.home.titleAccent}
            delay={400}
            stagger={40}
          />
        </span>
      </h1>

      <p className="mt-8 max-w-xl font-mono text-sm leading-[1.8] text-cyber-dim">
        <span className="mr-1 text-cyber-cyan">&gt;</span>
        {dictionary.home.subtitle}
        <br />
        <span className="mr-1 text-cyber-cyan">&gt;</span>
        {dictionary.home.subtitleSecond}
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link href={`/${locale}/blog` as Route} className="pp-btn">
          <span>◢ {dictionary.home.ctaBrowse}</span>
        </Link>
        <Link
          href={`/${locale}/portfolio` as Route}
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
