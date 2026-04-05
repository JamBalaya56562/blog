import type { Route } from "next"
import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

interface HeroSectionProps {
  readonly locale: Locale
  readonly dictionary: Dictionary
}

export function HeroSection({
  locale,
  dictionary,
}: Readonly<HeroSectionProps>) {
  return (
    <section
      className="relative flex min-h-[35vh] items-center justify-center overflow-hidden
        bg-[radial-gradient(circle_at_50%_50%,_rgba(0,91,192,0.08)_0%,_rgba(0,91,192,0.02)_40%,_transparent_70%)]
        dark:bg-[radial-gradient(circle_at_50%_50%,_rgba(173,198,255,0.06)_0%,_rgba(173,198,255,0.02)_40%,_transparent_70%)]"
    >
      <div className="mx-auto max-w-7xl px-2 py-6 text-center md:px-4 md:py-10">
        {/* Status Badges */}
        <div className="mb-8 flex flex-nowrap items-center justify-center gap-2 md:gap-3">
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-outline-variant/30 bg-surface-container-lowest/60 px-2.5 py-1 text-[11px] font-medium text-on-surface-variant backdrop-blur-md md:gap-2 md:px-4 md:py-1.5 md:text-xs dark:bg-surface-container/20">
            <span className="relative flex h-1.5 w-1.5 shrink-0 md:h-2 md:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-tint opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-surface-tint md:h-2 md:w-2" />
            </span>
            {dictionary.home.badge}
          </div>
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-outline-variant/30 bg-surface-container-lowest/60 px-2.5 py-1 text-[11px] font-medium text-on-surface-variant backdrop-blur-md md:gap-2 md:px-4 md:py-1.5 md:text-xs dark:bg-surface-container/20">
            <span className="relative flex h-1.5 w-1.5 shrink-0 md:h-2 md:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-tint opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-surface-tint md:h-2 md:w-2" />
            </span>
            {dictionary.home.badge2}
          </div>
        </div>

        {/* Main Title */}
        <h1 className="mx-auto max-w-4xl font-headline text-3xl font-extrabold leading-[1.1] tracking-tight text-primary dark:text-white md:text-7xl">
          {dictionary.home.title}
          <br />
          <span className="text-on-primary-container">
            {dictionary.home.titleAccent}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl font-sans text-sm leading-relaxed text-on-surface-variant md:text-lg">
          {dictionary.home.subtitle}
          <br />
          {dictionary.home.subtitleSecond}
        </p>

        {/* CTA Button */}
        <div className="mt-10">
          <Link
            href={`/${locale}/blog` as Route}
            className="inline-flex items-center rounded-lg bg-primary px-8 py-3 font-sans text-sm font-medium text-on-primary shadow-xl shadow-primary/10 transition-all hover:opacity-90 dark:bg-white dark:text-primary"
          >
            {dictionary.home.ctaBrowse}
          </Link>
        </div>
      </div>
    </section>
  )
}
