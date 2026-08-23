"use client"

import { useState, useRef, useEffect } from "react"
import { analyzeProductAction, type AnalyzeActionResult } from "@/app/actions/analyze"
import { RadarSweep } from "@/components/radar-sweep"
import { ArrowRight, TriangleAlert } from "lucide-react"

type FlowState = "idle" | "scanning" | "error"

const SCAN_LOG_STEPS = [
  "Ürün bağlantısı doğrulanıyor…",
  "Ürün bilgisi alınıyor…",
  "Yorumlar taranıyor…",
  "Sinyal işleniyor: yorumlar AI analizinden geçiyor…",
]

export default function HomePage() {
  const [url, setUrl] = useState("")
  const [flowState, setFlowState] = useState<FlowState>("idle")
  const [logStep, setLogStep] = useState(0)
  const [result, setResult] = useState<AnalyzeActionResult | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const isValidTrendyolUrl = /trendyol\.com\/.+-p-\d+/.test(url.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidTrendyolUrl) return

    setFlowState("scanning")
    setLogStep(0)
    setResult(null)

    intervalRef.current = setInterval(() => {
      setLogStep((prev) => Math.min(prev + 1, SCAN_LOG_STEPS.length - 1))
    }, 1100)

    // Başarılı olursa action zaten /analysis/[id]'e yönlendirir ve bu satırdan
    // sonrası hiç çalışmaz (sayfa unmount olur). Buraya dönülüyorsa hata var demektir.
    const res = await analyzeProductAction({
      productUrl: url.trim(),
      marketplace: "trendyol",
    })

    if (intervalRef.current) clearInterval(intervalRef.current)
    setResult(res)
    setFlowState("error")
  }

  function handleReset() {
    setFlowState("idle")
    setResult(null)
    setUrl("")
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-xl">
        {flowState === "idle" && (
          <div className="text-center">
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Ürün yorumlarını dinle.
            </h1>
            <p className="text-text-muted text-base mb-10 max-w-md mx-auto">
              Trendyol ürün linkini yapıştır. Radar yorumları tarasın,
              müşterinin gerçekte ne dediğini saniyeler içinde öğren.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.trendyol.com/marka/urun-adi-p-123456789"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3.5 font-mono text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal/50 transition"
              />
              {url.length > 0 && !isValidTrendyolUrl && (
                <p className="text-xs text-warning text-left flex items-center gap-1.5">
                  <TriangleAlert className="w-3.5 h-3.5" />
                  Geçerli bir Trendyol ürün linki gerekiyor (…-p-123456 formatında).
                </p>
              )}
              <button
                type="submit"
                disabled={!isValidTrendyolUrl}
                className="w-full bg-signal text-ink font-display font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition"
              >
                Taramayı başlat
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {flowState === "scanning" && (
          <div className="text-center">
            <RadarSweep blipCount={logStep + 2} />
            <div className="mt-8 font-mono text-sm space-y-2 min-h-[100px]">
              {SCAN_LOG_STEPS.slice(0, logStep + 1).map((step, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-text-muted animate-log-in"
                >
                  <span className="text-signal">›</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {flowState === "error" && result && !result.success && (
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-negative mb-6 bg-negative/10 border border-negative/20 rounded-full px-3 py-1">
              <TriangleAlert className="w-3.5 h-3.5" />
              TARAMA DURDU
            </div>

            <h2 className="font-display text-xl font-bold mb-3">
              {result.code === "NO_CREDITS"
                ? "Kredin kalmadı."
                : result.code === "UNAUTHORIZED"
                  ? "Giriş yapman gerekiyor."
                  : "Tarama tamamlanamadı."}
            </h2>
            <p className="text-text-muted text-sm mb-8 max-w-sm mx-auto">
              {result.error}
            </p>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-surface-raised border border-border hover:border-signal/50 px-6 py-3 rounded-lg font-display font-medium transition"
            >
              Tekrar dene
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
