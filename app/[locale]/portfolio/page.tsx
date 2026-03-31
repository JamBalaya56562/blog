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
  { name: "Next.js", url: "https://github.com/vercel/next.js" },
  { name: "Biome", url: "https://github.com/biomejs/biome" },
  { name: "Mise", url: "https://github.com/jdx/mise" },
  { name: "Dev Containers", url: "https://github.com/devcontainers" },
  { name: "Prettier", url: "https://github.com/prettier/prettier" },
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

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{dictionary.portfolio.title}</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        {dictionary.portfolio.intro}
      </p>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">
          {dictionary.portfolio.skills}
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">
          {dictionary.portfolio.projects}
        </h2>
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.name}>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {project.name}
              </a>
              <span className="text-gray-600 dark:text-gray-400">
                {" — "}
                {dictionary.portfolio[project.descriptionKey]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">
          {dictionary.portfolio.ossContributions}
        </h2>
        <p className="mb-3 text-gray-600 dark:text-gray-400">
          {dictionary.portfolio.ossDescription}
        </p>
        <div className="flex flex-wrap gap-2">
          {ossContributions.map((oss) => (
            <a
              key={oss.name}
              href={oss.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {oss.name}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">
          {dictionary.portfolio.links}
        </h2>
        <ul className="space-y-1">
          <li>
            <a
              href="https://github.com/JamBalaya56562"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://github.com/sponsors/JamBalaya56562"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              GitHub Sponsors
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
