import { estimateHeadlineEm } from "@/lib/typography"

export const OG_SIZE = { height: 630, width: 1200 }
export const OG_CONTENT_TYPE = "image/png"

const COLORS = {
  amber: "#ffb84d",
  bg0: "#04060a",
  bg1: "#080c12",
  cyan: "#7be4ff",
  dim: "rgba(230, 244, 255, 0.55)",
  faint: "rgba(230, 244, 255, 0.35)",
  line: "rgba(120, 200, 255, 0.18)",
  magenta: "#ff4d8f",
  text: "#e6f4ff",
  track: "rgba(120, 200, 255, 0.12)",
}

const CORNERS = [
  {
    borderLeft: `3px solid ${COLORS.cyan}`,
    borderTop: `3px solid ${COLORS.cyan}`,
    left: 0,
    top: 0,
  },
  {
    borderRight: `3px solid ${COLORS.cyan}`,
    borderTop: `3px solid ${COLORS.cyan}`,
    right: 0,
    top: 0,
  },
  {
    borderBottom: `3px solid ${COLORS.cyan}`,
    borderLeft: `3px solid ${COLORS.cyan}`,
    bottom: 0,
    left: 0,
  },
  {
    borderBottom: `3px solid ${COLORS.cyan}`,
    borderRight: `3px solid ${COLORS.cyan}`,
    bottom: 0,
    right: 0,
  },
]

const TITLE_MAX_PX = 76
const TITLE_MIN_PX = 40
const TITLE_LINE_PX = 976
const TITLE_LINES = 2

export function titleFontSize(title: string): number {
  const em = estimateHeadlineEm(title)
  if (em <= 0) {
    return TITLE_MAX_PX
  }
  const fit = Math.round((TITLE_LINE_PX * TITLE_LINES) / em)
  return Math.max(TITLE_MIN_PX, Math.min(TITLE_MAX_PX, fit))
}

export function OgCard({
  title,
  description,
  eyebrow = "JAM'S BLOG",
}: Readonly<{ title: string; description: string; eyebrow?: string }>) {
  return (
    <div
      style={{
        background: COLORS.bg0,
        display: "flex",
        height: "100%",
        padding: 48,
        width: "100%",
      }}
    >
      <div
        style={{
          background: COLORS.bg1,
          border: `1px solid ${COLORS.line}`,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          position: "relative",
        }}
      >
        {CORNERS.map((style) => (
          <div
            key={JSON.stringify(style)}
            style={{ height: 36, position: "absolute", width: 36, ...style }}
          />
        ))}

        <div
          style={{
            alignItems: "center",
            color: COLORS.cyan,
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
          }}
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 10 10"
            style={{ marginRight: 14 }}
          >
            <polygon points="10,0 10,10 0,10" fill={COLORS.cyan} />
          </svg>
          {eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: COLORS.text,
              display: "flex",
              fontSize: titleFontSize(title),
              fontWeight: 700,
              letterSpacing: 2,
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: COLORS.dim,
              display: "flex",
              fontSize: 27,
              lineHeight: 1.5,
              marginTop: 22,
              maxWidth: 900,
            }}
          >
            {description}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              background: COLORS.track,
              display: "flex",
              height: 5,
              width: "100%",
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, ${COLORS.cyan} 0%, ${COLORS.amber} 60%, ${COLORS.magenta} 100%)`,
                display: "flex",
                height: "100%",
                width: "78%",
              }}
            />
          </div>
          <div
            style={{
              color: COLORS.faint,
              display: "flex",
              fontSize: 20,
              letterSpacing: 3,
              marginTop: 18,
            }}
          >
            kokohore56562wanwan.site
          </div>
        </div>
      </div>
    </div>
  )
}
