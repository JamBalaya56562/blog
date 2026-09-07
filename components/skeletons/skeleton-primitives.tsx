interface SkeletonProps {
  readonly className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer border border-cyber-line bg-gradient-to-r from-cyber-bg-1 via-cyber-bg-2 to-cyber-bg-1 bg-[length:200%_100%] [animation:shimmer_1.5s_ease-in-out_infinite] ${className}`}
    />
  )
}
