"use client"

interface RadarSweepProps {
  blipCount?: number
}

export function RadarSweep({ blipCount = 0 }: RadarSweepProps) {
  // Sabit ama rastgele görünen konumlar — her render'da aynı kalsın diye deterministik
  const blipPositions = [
    { top: "30%", left: "62%" },
    { top: "55%", left: "28%" },
    { top: "70%", left: "58%" },
    { top: "40%", left: "45%" },
    { top: "22%", left: "40%" },
    { top: "60%", left: "70%" },
  ]

  return (
    <div className="relative w-44 h-44 mx-auto">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-signal/20"
          style={{ inset: `${i * 14}%` }}
        />
      ))}

      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className="absolute inset-0 animate-radar-spin origin-center"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(76,214,224,0.45), transparent 70deg)",
          }}
        />
      </div>

      {blipPositions.slice(0, blipCount).map((pos, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-signal animate-blip-in"
          style={{ top: pos.top, left: pos.left, animationDelay: `${i * 0.15}s` }}
        />
      ))}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-signal shadow-[0_0_16px_3px_rgba(76,214,224,0.7)]" />
    </div>
  )
}
