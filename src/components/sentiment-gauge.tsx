interface SentimentGaugeProps {
  score: number // -1..1
}

export function SentimentGauge({ score }: SentimentGaugeProps) {
  const clamped = Math.max(-1, Math.min(1, score))
  const pct = (clamped + 1) / 2
  const radius = 70
  const circumference = Math.PI * radius
  const offset = circumference * (1 - pct)

  const color =
    clamped > 0.15 ? "#5CD98A" : clamped < -0.15 ? "#FF6B5E" : "#F2A93B"

  const label =
    clamped > 0.4
      ? "Belirgin pozitif"
      : clamped > 0.15
        ? "Pozitif"
        : clamped < -0.4
          ? "Belirgin negatif"
          : clamped < -0.15
            ? "Negatif"
            : "Karışık / nötr"

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path
          d="M20,90 A70,70 0 0 1 160,90"
          fill="none"
          stroke="#223047"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M20,90 A70,70 0 0 1 160,90"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="-mt-2 text-center">
        <div className="font-mono text-2xl font-bold" style={{ color }}>
          {clamped >= 0 ? "+" : ""}
          {clamped.toFixed(2)}
        </div>
        <div className="text-xs text-text-muted mt-1">{label}</div>
      </div>
    </div>
  )
}
