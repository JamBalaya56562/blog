interface SkeletonProps {
  readonly className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-linear-to-r from-surface-container-low via-surface-container to-surface-container-low bg-[length:200%_100%] [animation:shimmer_1.5s_ease-in-out_infinite] ${className}`}
    />
  )
}
