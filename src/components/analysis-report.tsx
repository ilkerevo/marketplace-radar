"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Star, ExternalLink, CircleCheck, CircleX, User, Lightbulb } from "lucide-react"
import { SentimentGauge } from "@/components/sentiment-gauge"
import type { Analysis, Product, Json } from "@/types/database.types"

interface AnalysisReportProps {
  analysis: Analysis
  product: Product
}

function asStringArray(json: Json): string[] {
  if (!Array.isArray(json)) return []
  return json.filter((x): x is string => typeof x === "string")
}

function asFrequentWords(json: Json): { word: string; count: number }[] {
  if (!Array.isArray(json)) return []
  return json
    .map((item) => {
      if (typeof item !== "object" || item === null) return null
      const obj = item as Record<string, unknown>
      if (typeof obj.word !== "string" || typeof obj.count !== "number") return null
      return { word: obj.word, count: obj.count }
    })
    .filter((x): x is { word: string; count: number } => x !== null)
}

const MARKETPLACE_LABELS: Record<string, string> = {
  trendyol: "Trendyol",
  hepsiburada: "Hepsiburada",
  amazon: "Amazon",
}

export function AnalysisReport({ analysis, product }: AnalysisReportProps) {
  const positivePoints = asStringArray(analysis.positive_points)
  const negativePoints = asStringArray(analysis.negative_points)
  const actionableTips = asStringArray(analysis.actionable_tips)
  const frequentWords = asFrequentWords(analysis.frequent_words).sort(
    (a, b) => b.count - a.count
  )

  return (
    <div className="space-y-8">
      {/* Ürün başlığı */}
      <header>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] font-mono uppercase tracking-wider bg-surface-raised border border-border text-text-muted px-2 py-1 rounded">
            {MARKETPLACE_LABELS[product.marketplace] ?? product.marketplace}
          </span>
          {product.rating != null && (
            <span className="flex items-center gap-1 text-xs font-mono text-warning">
              <Star className="w-3.5 h-3.5 fill-warning" />
              {product.rating.toFixed(1)}
              {product.total_reviews != null && (
                <span className="text-text-muted">({product.total_reviews})</span>
              )}
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug">
          {product.title}
        </h1>
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-signal transition mt-2"
        >
          Ürünü görüntüle <ExternalLink className="w-3 h-3" />
        </a>
      </header>

      {/* Özet + sinyal skoru */}
      <section className="bg-surface border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        <SentimentGauge score={analysis.sentiment_score} />
        <p className="text-sm text-text-muted leading-relaxed flex-1">
          {analysis.summary}
        </p>
      </section>

      {/* Sık geçen kelimeler */}
      {frequentWords.length > 0 && (
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-text-muted mb-4">
            Yorumlarda sık geçen kelimeler
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequentWords} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#223047" horizontal={false} />
                <XAxis type="number" stroke="#8493A8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="word"
                  stroke="#8493A8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "rgba(76,214,224,0.06)" }}
                  contentStyle={{
                    background: "#182338",
                    border: "1px solid #223047",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#E7ECF3" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {frequentWords.map((_, i) => (
                    <Cell key={i} fill="#4CD6E0" fillOpacity={0.85 - i * 0.06} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Pozitif / Negatif noktalar */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-positive/20 rounded-xl p-6">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-positive mb-4 flex items-center gap-2">
            <CircleCheck className="w-4 h-4" /> Öne çıkan olumlu noktalar
          </h2>
          <ul className="space-y-2.5">
            {positivePoints.map((point, i) => (
              <li key={i} className="text-sm text-text-primary flex gap-2">
                <span className="text-positive mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface border border-negative/20 rounded-xl p-6">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-negative mb-4 flex items-center gap-2">
            <CircleX className="w-4 h-4" /> Öne çıkan şikayetler
          </h2>
          <ul className="space-y-2.5">
            {negativePoints.map((point, i) => (
              <li key={i} className="text-sm text-text-primary flex gap-2">
                <span className="text-negative mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Alıcı profili */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display font-bold text-sm uppercase tracking-wide text-text-muted mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-signal" /> Alıcı profili
        </h2>
        <p className="text-sm text-text-primary leading-relaxed">{analysis.buyer_persona}</p>
      </section>

      {/* Aksiyon önerileri */}
      <section className="bg-surface border border-signal/20 rounded-xl p-6">
        <h2 className="font-display font-bold text-sm uppercase tracking-wide text-signal mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Satıcı için aksiyon önerileri
        </h2>
        <ol className="space-y-3">
          {actionableTips.map((tip, i) => (
            <li key={i} className="text-sm text-text-primary flex gap-3">
              <span className="font-mono text-signal shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              {tip}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
