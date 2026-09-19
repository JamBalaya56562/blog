import type { Route } from "next"
import Link from "next/link"
import { SplitText } from "@/components/ui/split-text"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { estimateHeadlineEm, estimateLongestWordEm } from "@/lib/typography"

interface HeroSectionProps {
  readonly locale: Locale
  readonly dictionary: Dictionary
}

export function HeroSection({
  locale,
  dictionary,
}: Readonly<HeroSectionProps>) {
  const headlineEm = Math.max(
    estimateHeadlineEm(dictionary.home.title),
    estimateHeadlineEm(dictionary.home.titleAccent),
  )
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
    </section>
  )
}
