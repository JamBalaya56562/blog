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

export function CircuitBackground() {
  return (
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
              style={
                {
                  "--circuit-len": c.len,
                  "--circuit-dur": `${c.dur}s`,
                  "--circuit-delay": `${c.delay}s`,
                  strokeDasharray: c.len,
                  strokeDashoffset: c.len,
                } as React.CSSProperties
              }
            />
          </g>
        ))}
      </svg>
      {circuits.map((c) =>
        c.nodes.map((n) => (
          <div
            key={`${c.id}-${n[0]}-${n[1]}`}
            className="absolute rounded-full circuit-node-dot"
            style={
              {
                "--circuit-dur": `${c.dur}s`,
                "--circuit-delay": `${c.delay + n[2]}s`,
                left: `${(n[0] / 1200) * 100}%`,
                top: `${(n[1] / 1000) * 100}%`,
                width: "10px",
                height: "10px",
                border: `2px solid ${c.color}`,
              } as React.CSSProperties
            }
          />
        )),
      )}
    </div>
  )
}
