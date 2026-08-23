interface SentimentBadgeProps {
  score: number
}

export function SentimentBadge({ score }: SentimentBadgeProps) {
  const clamped = Math.max(-1, Math.min(1, score))
  const color = clamped > 0.15 ? "#5CD98A" : clamped < -0.15 ? "#FF6B5E" : "#F2A93B"

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full border"
      style={{ color, borderColor: `${color}33`, backgroundColor: `${color}14` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {clamped >= 0 ? "+" : ""}
      {clamped.toFixed(2)}
    </span>
  )
}
