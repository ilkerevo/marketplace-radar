import Link from "next/link"
import { Star, ArrowRight } from "lucide-react"
import { SentimentBadge } from "@/components/sentiment-badge"
import { getMarketplaceConfig } from "@/lib/marketplace-config"
import type { Analysis, Product } from "@/types/database.types"

interface AnalysisListItemProps {
  analysis: Pick<Analysis, "id" | "sentiment_score" | "created_at">
  product: Pick<Product, "title" | "marketplace" | "rating">
}

export function AnalysisListItem({ analysis, product }: AnalysisListItemProps) {
  const { label, color } = getMarketplaceConfig(product.marketplace)
  const date = new Date(analysis.created_at).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 hover:border-signal/40 transition group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border"
            style={{ color, borderColor: `${color}40`, backgroundColor: `${color}14` }}
          >
            {label}
          </span>
          <span className="text-[11px] font-mono text-text-muted">{date}</span>
          {product.rating != null && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-warning">
              <Star className="w-3 h-3 fill-warning" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="font-display font-medium text-sm truncate">{product.title}</h3>
      </div>

      <SentimentBadge score={analysis.sentiment_score} />

      <Link
        href={`/analysis/${analysis.id}`}
        className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-text-muted group-hover:text-signal transition"
      >
        Detayı gör
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
