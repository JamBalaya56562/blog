/**
 * Fullscreen cyberpunk background — fixed, behind everything.
 * Layers: grid + noise + scanlines + sweep.
 * Replaces ParticleNetwork / CodeRain / CircuitBackground from the old design.
 */
export function CyberBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="pp-grid-bg" />
      <div className="pp-noise" />
      <div className="pp-scan" />
      <div className="pp-scan-sweep" />
    </div>
  )
}
