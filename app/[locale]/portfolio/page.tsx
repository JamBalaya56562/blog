import {
  Archive,
  Building2,
  Container,
  ExternalLink,
  GitBranch,
  Heart,
  MapPin,
  Palette,
  Rss,
  Terminal,
  Wrench,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { Brackets } from "@/components/ui/brackets"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { localeAlternates } from "@/lib/site"

const skills = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Bun",
  "Biome",
  "Docker",
  "Rust",
  "Go",
]

/**
 * The contribution given the wide card at the head of the grid. Mise is the
 * one with by far the most merged work, so it leads and the rest follow in
 * descending order.
 */
const featuredContribution = {
  descriptionKey: "miseDescription" as const,
  Icon: Wrench,
  merged: 226,
  name: "Mise",
  url: "https://github.com/jdx/mise",
}

/**
 * Per-OSS visual identity. The cyber frame (border + brackets) stays
 * consistent across all cards; the accent color tints the icon, the
 * background wash, and the giant watermark icon in the corner.
 */
const ossContributions = [
  {
    accent: "text-sky-400",
    bg: "bg-sky-500/10",
    descriptionKey: "duplicatiDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(56_189_248_/_0.6)]",
    Icon: Archive,
    merged: 119,
    name: "Duplicati",
    url: "https://github.com/duplicati/duplicati",
  },
  {
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    descriptionKey: "ohMyPoshDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(167_139_250_/_0.6)]",
    Icon: Terminal,
    merged: 62,
    name: "Oh My Posh",
    url: "https://github.com/JanDeDobbeleer/oh-my-posh",
  },
  {
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    descriptionKey: "dockerMavenPluginDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(34_211_238_/_0.6)]",
    Icon: Container,
    merged: 36,
    name: "docker-maven-plugin",
    url: "https://github.com/fabric8io/docker-maven-plugin",
  },
  {
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    descriptionKey: "goGithubDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(52_211_153_/_0.6)]",
    Icon: GitBranch,
    merged: 30,
    name: "go-github",
    url: "https://github.com/google/go-github",
  },
  {
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    descriptionKey: "daisyuiDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(251_113_133_/_0.6)]",
    Icon: Palette,
    merged: 26,
    name: "daisyUI",
    url: "https://github.com/saadeghi/daisyui",
  },
  {
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    descriptionKey: "dolibarrDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(251_191_36_/_0.6)]",
    Icon: Building2,
    merged: 25,
    name: "Dolibarr",
    url: "https://github.com/Dolibarr/dolibarr",
  },
  {
    accent: "text-orange-400",
    bg: "bg-orange-500/10",
    descriptionKey: "freshrssDescription" as const,
    glow: "shadow-[0_0_24px_-8px_rgb(251_146_60_/_0.6)]",
    Icon: Rss,
    merged: 16,
    name: "FreshRSS",
    url: "https://github.com/FreshRSS/FreshRSS",
  },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    return {}
  }
  return { alternates: localeAlternates(locale, "/portfolio") }
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  "use cache"
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <PageTransition>
      <div className="relative mx-auto max-w-7xl px-7 py-12">
        {/* Header */}
        <h1 className="pp-display text-5xl text-foreground sm:text-6xl">
          ABOUT<span className="text-cyber-cyan">.</span>
        </h1>
        <p className="mt-2 font-mono text-xs">
          <span className="mr-1 text-cyber-cyan">{"//"}</span>
          <span className="text-cyber-dim">
            {dictionary.portfolio.subtitle}
          </span>
        </p>

        {/* ID card + bio */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left — operator portrait */}
          <aside className="lg:col-span-4">
            <div className="relative border border-cyber-line bg-cyber-bg-1/50 p-5">
              <Brackets />
              <div className="relative aspect-square overflow-hidden border border-cyber-line">
                <Image
                  src="/jambalaya.jpg"
                  alt={dictionary.portfolio.title}
                  width={320}
                  height={320}
                  className="h-full w-full object-cover"
                  priority
                />
                <span className="pointer-events-none absolute inset-x-0 top-3 px-3">
                  <span className="pp-tick text-cyber-cyan">◢ ID</span>
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <Field
                  label={dictionary.portfolio.idHandle}
                  value="@JamBalaya56562"
                  mono
                />
                <Field label={dictionary.portfolio.idName} value="Jam Balaya" />
                <Field
                  label={dictionary.portfolio.idLocation}
                  value={dictionary.portfolio.locationValue}
                />
              </div>
            </div>

            {/* Quick connectivity */}
            <div className="mt-6 border border-cyber-line bg-cyber-bg-1/50 p-5">
              <div className="pp-tick mb-4 text-cyber-cyan">◢ CONNECTIVITY</div>
              <h3 className="pp-display mb-4 text-base text-foreground">
                {dictionary.portfolio.quickConnectivity}
              </h3>
              <ul className="space-y-3">
                <ConnectivityItem
                  href="https://github.com/JamBalaya56562"
                  label={dictionary.portfolio.github}
                  value="@JamBalaya56562"
                  icon={
                    <Image
                      src="/github-mark.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="block dark:hidden"
                    />
                  }
                  iconDark={
                    <Image
                      src="/github-mark-white.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="hidden dark:block"
                    />
                  }
                />
                <ConnectivityItem
                  href="https://github.com/sponsors/JamBalaya56562"
                  label={dictionary.portfolio.githubSponsors}
                  value="Sponsor"
                  icon={<Heart className="h-4 w-4 text-cyber-magenta" />}
                />
                <ConnectivityItem
                  label={dictionary.portfolio.location}
                  value={dictionary.portfolio.locationValue}
                  icon={<MapPin className="h-4 w-4 text-cyber-amber" />}
                />
              </ul>
            </div>
          </aside>

          {/* Right — bio & tech stack */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="pp-tick mb-3 text-cyber-cyan">◢ BIOGRAPHY</div>
              <h2 className="pp-display mb-5 text-3xl text-foreground">
                {dictionary.portfolio.bioTitle}
              </h2>
              <div className="space-y-5 font-sans text-base leading-loose text-foreground/85">
                <p>{dictionary.portfolio.bioText1}</p>
                <p>{dictionary.portfolio.bioText2}</p>
              </div>
            </section>

            <section>
              <div className="pp-tick mb-3 text-cyber-cyan">◢ STACK</div>
              <h2 className="pp-display mb-4 text-2xl text-foreground">
                {dictionary.portfolio.techCore}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill} className="pp-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="relative border border-cyber-line bg-cyber-bg-1/50 p-6">
              <Brackets color="amber" />
              <p className="mb-3 font-mono text-sm italic text-cyber-amber">
                {dictionary.portfolio.quoteText}
              </p>
              <p className="pp-tick">{dictionary.portfolio.quoteAuthor}</p>
            </section>
          </div>
        </div>

        {/* Deployment log / projects */}
        <section className="mt-16">
          <div className="mb-6 flex flex-wrap items-baseline gap-4">
            <span className="pp-tick">◢ DEPLOYMENT_LOG</span>
            <h2 className="pp-display text-3xl text-foreground sm:text-4xl">
              {dictionary.portfolio.sideProjects}
            </h2>
            <span className="h-px flex-1 bg-cyber-line" />
            <a
              href="https://github.com/JamBalaya56562"
              target="_blank"
              rel="noopener noreferrer"
              className="pp-tick pp-link inline-flex items-center gap-1 text-cyber-cyan transition-colors hover:text-cyber-cyan-bright"
            >
              {dictionary.portfolio.viewAllOnGithub}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="mb-8 max-w-2xl font-mono text-sm text-cyber-dim">
            {dictionary.portfolio.sideProjectsDescription}
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Featured contribution — the wide card at the head of the grid. */}
            <a
              href={featuredContribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pp-card-hover relative border border-cyber-line bg-cyber-bg-1/50 p-6 md:col-span-2"
            >
              <Brackets />
              <div className="mb-4 flex items-center gap-2">
                <featuredContribution.Icon className="h-4 w-4 text-cyber-cyan" />
                <span className="pp-tick text-cyber-cyan">
                  ◢ {dictionary.portfolio.featuredContribution}
                </span>
                <span className="pp-tick ml-auto text-cyber-dim">
                  <span className="pp-num text-cyber-cyan">
                    {featuredContribution.merged}
                  </span>{" "}
                  MERGED
                </span>
              </div>
              <h3 className="pp-display mb-3 text-2xl text-foreground">
                {featuredContribution.name}
              </h3>
              <p className="max-w-md font-mono text-sm text-cyber-dim">
                {dictionary.portfolio[featuredContribution.descriptionKey]}
              </p>
              <div className="pp-bar mt-6">
                <div className="pp-bar-fill" style={{ width: "78%" }} />
              </div>
            </a>

            {ossContributions.map((oss) => (
              <a
                key={oss.name}
                href={oss.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`pp-card-hover group relative flex flex-col overflow-hidden border border-cyber-line p-5 ${oss.bg} ${oss.glow}`}
              >
                <Brackets />
                {/* Faded icon watermark. Kept small and tucked into the corner
                    so it never sits behind the description. */}
                <oss.Icon
                  aria-hidden
                  className={`pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 opacity-10 transition-opacity duration-300 group-hover:opacity-25 ${oss.accent}`}
                />
                <div className="relative flex flex-1 flex-col">
                  {/* Icon, label and name share one row; the merged count sits
                      at the far end as a HUD readout. */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border border-cyber-line ${oss.accent} ${oss.bg}`}
                    >
                      <oss.Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="pp-tick block text-cyber-amber/80">
                        ◢ OSS
                      </span>
                      {/* Wraps rather than truncates: `docker-maven-plugin`
                          overran the row by a few pixels, and a name is not
                          worth hiding to save one line. */}
                      <span className="pp-display mt-0.5 block break-words text-lg text-foreground">
                        {oss.name}
                      </span>
                    </span>
                    <span className="pp-tick shrink-0 whitespace-nowrap text-cyber-dim">
                      <span className={`pp-num ${oss.accent}`}>
                        {oss.merged}
                      </span>{" "}
                      MERGED
                    </span>
                  </div>
                  <span className="mt-4 block h-px bg-cyber-line" />
                  <p className="mt-3 font-mono text-xs leading-relaxed text-cyber-dim">
                    {dictionary.portfolio[oss.descriptionKey]}
                  </p>
                </div>
              </a>
            ))}

            {/* Collaborate CTA */}
            <div className="relative border border-cyber-amber/60 bg-cyber-amber/5 p-6 md:col-span-3">
              <Brackets color="amber" />
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="pp-tick mb-2 text-cyber-amber">◢ COLLAB</div>
                  <h3 className="pp-display text-2xl text-foreground">
                    {dictionary.portfolio.collaborateCta}
                  </h3>
                  <p className="mt-2 max-w-xl font-mono text-sm text-cyber-dim">
                    {dictionary.portfolio.collaborateDescription}
                  </p>
                </div>
                <a
                  href="https://github.com/sponsors/JamBalaya56562"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pp-btn pp-btn-amber whitespace-nowrap"
                >
                  <span>◢ {dictionary.portfolio.getInTouch}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  readonly label: string
  readonly value: string
  readonly mono?: boolean
}) {
  return (
    <div>
      <div className="pp-tick">{label}</div>
      <div
        className={`mt-1 ${mono ? "pp-num text-cyber-cyan" : "text-foreground"} text-sm`}
      >
        {value}
      </div>
    </div>
  )
}

function ConnectivityItem({
  href,
  label,
  value,
  icon,
  iconDark,
}: {
  readonly href?: string
  readonly label: string
  readonly value: string
  readonly icon: React.ReactNode
  readonly iconDark?: React.ReactNode
}) {
  const inner = (
    <>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-cyber-line bg-cyber-bg-1">
        {icon}
        {iconDark}
      </div>
      <div>
        <div className="pp-tick">{label}</div>
        <div className="pp-num text-sm text-foreground">{value}</div>
      </div>
    </>
  )
  return (
    <li className="flex items-center gap-3">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center gap-3 transition-colors hover:text-cyber-cyan"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  )
}
