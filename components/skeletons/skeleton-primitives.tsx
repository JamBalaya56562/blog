interface SkeletonProps {
  readonly className?: string
}

/**
 * Cyber-themed shimmer block. Uses `--cyber-bg-1` ↔ `--cyber-line` so it
 * matches the panel/border palette of the rest of the redesign instead
 * of the legacy Material 3 surface tones.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer border border-cyber-line bg-gradient-to-r from-cyber-bg-1 via-cyber-bg-2 to-cyber-bg-1 bg-[length:200%_100%] [animation:shimmer_1.5s_ease-in-out_infinite] ${className}`}
    />
  )
}
