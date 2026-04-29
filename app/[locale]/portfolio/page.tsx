import {
  Box,
  ExternalLink,
  FolderOpen,
  Heart,
  MapPin,
  Paintbrush,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Brackets } from "@/components/ui/brackets"
import { isValidLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

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

const projects = [
  {
    name: "blog",
    url: "https://github.com/JamBalaya56562/blog",
    descriptionKey: "blogDescription" as const,
  },
]

/**
 * Per-OSS visual identity. The cyber frame (border + brackets) stays
 * consistent across all cards; the accent color tints the icon, the
 * background wash, and the giant watermark icon in the corner.
 */
const ossContributions = [
  {
    name: "Next.js",
    url: "https://github.com/vercel/next.js",
    Icon: Sparkles,
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    glow: "shadow-[0_0_24px_-8px_rgb(167_139_250_/_0.6)]",
  },
  {
    name: "Biome",
    url: "https://github.com/biomejs/biome",
    Icon: Terminal,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_24px_-8px_rgb(52_211_153_/_0.6)]",
  },
  {
    name: "Mise",
    url: "https://github.com/jdx/mise",
    Icon: Wrench,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_24px_-8px_rgb(251_191_36_/_0.6)]",
  },
  {
    name: "Dev Containers",
    url: "https://github.com/devcontainers",
    Icon: Box,
    accent: "text-sky-400",
    bg: "bg-sky-500/10",
    glow: "shadow-[0_0_24px_-8px_rgb(56_189_248_/_0.6)]",
  },
  {
    name: "Prettier",
    url: "https://github.com/prettier/prettier",
    Icon: Paintbrush,
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    glow: "shadow-[0_0_24px_-8px_rgb(251_113_133_/_0.6)]",
  },
]

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
  const project = projects[0]
  if (!project) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-7xl px-7 py-12">
      {/* Header */}
      <h1 className="pp-display text-5xl text-foreground sm:text-6xl">
        ABOUT<span className="text-cyber-cyan">.</span>
      </h1>
      <p className="mt-2 font-mono text-xs">
        <span className="mr-1 text-cyber-cyan">{"//"}</span>
        <span className="text-cyber-dim">{dictionary.portfolio.subtitle}</span>
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
          <h2 className="pp-display text-3xl tracking-tight text-foreground sm:text-4xl">
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
          {/* Featured project */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pp-card-hover relative border border-cyber-line bg-cyber-bg-1/50 p-6 md:col-span-2"
          >
            <Brackets />
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-cyber-cyan" />
              <span className="pp-tick text-cyber-cyan">
                ◢ {dictionary.portfolio.activeProject}
              </span>
            </div>
            <h3 className="pp-display mb-3 text-2xl text-foreground">
              {project.name}
            </h3>
            <p className="max-w-md font-mono text-sm text-cyber-dim">
              {dictionary.portfolio[project.descriptionKey]}
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
              className={`pp-card-hover group relative overflow-hidden border border-cyber-line p-5 ${oss.bg} ${oss.glow}`}
            >
              <Brackets />
              {/* Giant faded icon watermark — bleeds out of the card and
                  brightens on hover for a subtle visual cue. */}
              <oss.Icon
                aria-hidden
                className={`pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 opacity-10 transition-opacity duration-300 group-hover:opacity-25 ${oss.accent}`}
              />
              <div className="relative">
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center border border-cyber-line ${oss.accent} ${oss.bg}`}
                >
                  <oss.Icon className="h-5 w-5" />
                </div>
                <div className="pp-tick text-cyber-amber/80">◢ OSS</div>
                <h3 className="pp-display mt-1 text-lg text-foreground">
                  {oss.name}
                </h3>
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
