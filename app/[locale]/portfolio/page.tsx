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

const ossContributions = [
  {
    name: "Next.js",
    url: "https://github.com/vercel/next.js",
    Icon: Sparkles,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    name: "Biome",
    url: "https://github.com/biomejs/biome",
    Icon: Terminal,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    name: "Mise",
    url: "https://github.com/jdx/mise",
    Icon: Wrench,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    name: "Dev Containers",
    url: "https://github.com/devcontainers",
    Icon: Box,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    name: "Prettier",
    url: "https://github.com/prettier/prettier",
    Icon: Paintbrush,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
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

  // Circuit board background data: [x, y, delayOffset] for each node
  const circuits = [
    {
      id: "c1",
      d: "M0,120 H200 V280 H400",
      color: "var(--primary)",
      len: 700,
      dur: 6,
      delay: 0,
      nodes: [
        [200, 120, 0],
        [200, 280, 0.4],
        [400, 280, 0.8],
      ],
    },
    {
      id: "c2",
      d: "M1200,80 H950 V220 H750 V360",
      color: "#10b981",
      len: 800,
      dur: 8,
      delay: 2,
      nodes: [
        [950, 80, 0],
        [950, 220, 0.5],
        [750, 220, 0.8],
        [750, 360, 1.2],
      ],
    },
    {
      id: "c3",
      d: "M100,500 H300 V660 H550 V500 H700",
      color: "#f59e0b",
      len: 900,
      dur: 7,
      delay: 1,
      nodes: [
        [300, 500, 0],
        [300, 660, 0.5],
        [550, 660, 0.9],
        [550, 500, 1.3],
        [700, 500, 1.6],
      ],
    },
    {
      id: "c4",
      d: "M1200,400 H1000 V560 H1150 V720",
      color: "#8b5cf6",
      len: 800,
      dur: 9,
      delay: 3,
      nodes: [
        [1000, 400, 0],
        [1000, 560, 0.5],
        [1150, 560, 0.9],
        [1150, 720, 1.3],
      ],
    },
    {
      id: "c5",
      d: "M50,780 H280 V920 H500",
      color: "#f43f5e",
      len: 650,
      dur: 7,
      delay: 4,
      nodes: [
        [280, 780, 0],
        [280, 920, 0.5],
        [500, 920, 1.0],
      ],
    },
  ] as const

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Circuit Board Background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          role="img"
          viewBox="0 0 1200 1000"
          preserveAspectRatio="none"
        >
          <title>Circuit board background decoration</title>
          {circuits.map((c) => (
            <g key={c.id} stroke={c.color} fill="none">
              <path
                d={c.d}
                className="circuit-path"
                style={{
                  strokeDasharray: c.len,
                  strokeDashoffset: c.len,
                  animation: `circuitDraw ${c.dur}s ease-in-out ${c.delay}s infinite`,
                }}
              />
            </g>
          ))}
        </svg>
        {/* Nodes rendered as HTML divs to stay circular regardless of aspect ratio */}
        {circuits.map((c) =>
          c.nodes.map((n) => (
            <div
              key={`${c.id}-${n[0]}-${n[1]}`}
              className="absolute rounded-full circuit-node-dot"
              style={{
                left: `${(n[0] / 1200) * 100}%`,
                top: `${(n[1] / 1000) * 100}%`,
                width: "10px",
                height: "10px",
                border: `2px solid ${c.color}`,
                animation: `circuitNodeFade ${c.dur}s ease-in-out ${c.delay + n[2]}s infinite`,
              }}
            />
          )),
        )}
      </div>
      {/* Hero Section */}
      <section className="mb-24 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <Image
            src="/jambalaya.jpg"
            alt={dictionary.portfolio.title}
            width={128}
            height={128}
            className="rounded-full ring-4 ring-surface-container-lowest"
            priority
          />
          {/* Online status indicator */}
          <span className="absolute bottom-1 right-1 flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-tint opacity-75" />
            <span className="relative inline-flex h-5 w-5 rounded-full bg-surface-tint" />
          </span>
        </div>
        <h1 className="font-headline tracking-tighter text-primary text-5xl md:text-7xl">
          Jam Balaya
        </h1>
        <p className="mt-4 text-lg text-secondary">
          {dictionary.portfolio.subtitle}
        </p>
      </section>

      {/* Asymmetric 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-16">
          {/* Bio Section */}
          <section className="bg-surface-container-lowest p-8 rounded-xl ring-1 ring-outline-variant/10 shadow-[0_12px_32px_rgba(25,28,30,0.04)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-primary-fixed rounded-full" />
              <h2 className="font-headline text-3xl font-bold tracking-tight">
                {dictionary.portfolio.bioTitle}
              </h2>
            </div>
            <div className="space-y-6 text-on-surface-variant leading-loose text-lg">
              <p>{dictionary.portfolio.bioText1}</p>
              <p>{dictionary.portfolio.bioText2}</p>
            </div>
          </section>

          {/* Tech Stack Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="h-5 w-5 text-primary" />
              <h2 className="font-headline text-3xl font-bold tracking-tight">
                {dictionary.portfolio.techCore}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-5 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-8">
          {/* Connectivity Card */}
          <div className="bg-surface-container-lowest p-8 rounded-xl ring-1 ring-outline-variant/10 shadow-[0_12px_32px_rgba(25,28,30,0.04)]">
            <h3 className="font-headline text-lg font-bold mb-6">
              {dictionary.portfolio.quickConnectivity}
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://github.com/JamBalaya56562"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                    <Image
                      src="/github-mark.svg"
                      alt="GitHub"
                      width={20}
                      height={20}
                      className="dark:invert"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest">
                      {dictionary.portfolio.github}
                    </p>
                    <p className="text-sm font-semibold">@JamBalaya56562</p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sponsors/JamBalaya56562"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                    <Heart className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest">
                      {dictionary.portfolio.githubSponsors}
                    </p>
                    <p className="text-sm font-semibold">Sponsor</p>
                  </div>
                </a>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                  <MapPin className="h-5 w-5 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-xs text-secondary font-medium uppercase tracking-widest">
                    {dictionary.portfolio.location}
                  </p>
                  <p className="text-sm font-semibold">
                    {dictionary.portfolio.locationValue}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Quote Card */}
          <div className="bg-primary p-8 rounded-xl text-on-primary">
            <p className="text-sm font-medium mb-4 opacity-80 italic">
              {dictionary.portfolio.quoteText}
            </p>
            <p className="text-xs opacity-60">
              {dictionary.portfolio.quoteAuthor}
            </p>
          </div>
        </div>
      </div>

      {/* Projects / OSS Bento Grid */}
      <section className="mt-32">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <h2 className="font-headline text-4xl font-extrabold tracking-tighter mb-2">
              {dictionary.portfolio.sideProjects}
            </h2>
            <p className="text-secondary">
              {dictionary.portfolio.sideProjectsDescription}
            </p>
          </div>
          <a
            href="https://github.com/JamBalaya56562"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
          >
            {dictionary.portfolio.viewAllOnGithub}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Blog Project Feature Card */}
          <a
            href={projects[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="md:col-span-2 bg-surface-container-low p-8 rounded-xl group hover:bg-surface-container transition-colors relative overflow-hidden block"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase">
                  {dictionary.portfolio.activeProject}
                </span>
              </div>
              <h3 className="font-headline text-2xl font-bold mb-4">
                {projects[0].name}
              </h3>
              <p className="text-on-surface-variant max-w-md">
                {dictionary.portfolio[projects[0].descriptionKey]}
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity">
              <FolderOpen className="h-48 w-48 text-primary" />
            </div>
          </a>

          {/* OSS Contribution Cards */}
          {ossContributions.map((oss) => (
            <a
              key={oss.name}
              href={oss.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-container-lowest p-8 rounded-xl ring-1 ring-outline-variant/10 group hover:shadow-lg transition-all block relative overflow-hidden"
            >
              <div
                className={`w-10 h-10 rounded-lg ${oss.bg} flex items-center justify-center mb-4`}
              >
                <oss.Icon className={`h-5 w-5 ${oss.color}`} />
              </div>
              <h3 className="font-headline text-xl font-bold mb-2 relative z-10">
                {oss.name}
              </h3>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-15 transition-opacity">
                <oss.Icon className={`h-28 w-28 ${oss.color}`} />
              </div>
            </a>
          ))}

          {/* Collaboration CTA Card */}
          <div className="md:col-span-2 bg-primary p-8 rounded-xl text-on-primary flex flex-col md:flex-row items-center gap-8 justify-between">
            <div>
              <h3 className="font-headline text-2xl font-bold mb-2">
                {dictionary.portfolio.collaborateCta}
              </h3>
              <p className="opacity-70">
                {dictionary.portfolio.collaborateDescription}
              </p>
            </div>
            <a
              href="https://github.com/sponsors/JamBalaya56562"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-on-primary text-primary rounded-lg font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {dictionary.portfolio.getInTouch}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
