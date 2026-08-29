import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSearch } from "@/components/dashboard-search"
import { AnalysisListItem } from "@/components/analysis-list-item"
import { PaymentBanner } from "@/components/payment-banner"
import { Radar, ArrowRight } from "lucide-react"
import type { Product } from "@/types/database.types"

interface PageProps {
  // Next 14 kullanıyorsan: `searchParams: { q?: string; payment?: string }` yap, await'i kaldır.
  searchParams: Promise<{ q?: string; payment?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { q = "", payment } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let query = supabase
    .from("analyses")
    .select("id, sentiment_score, created_at, product:products!inner(title, marketplace, rating, user_id)")
    .eq("product.user_id", user.id)
    .order("created_at", { ascending: false })

  if (q.trim()) {
    query = query.ilike("product.title", `%${q.trim()}%`)
  }

  const { data } = await query

  const results = (data ?? []) as unknown as Array<{
    id: string
    sentiment_score: number
    created_at: string
    product: Pick<Product, "title" | "marketplace" | "rating">
  }>

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <PaymentBanner status={payment} />

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Panel</h1>
            <p className="text-sm text-text-muted mt-1">
              Taradığın tüm ürünler ve sinyal sonuçları burada.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-signal text-ink font-display font-bold text-sm px-4 py-2.5 rounded-lg hover:brightness-110 transition"
          >
            Yeni tarama
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mb-6">
          <DashboardSearch initialQuery={q} />
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((item) => (
              <AnalysisListItem key={item.id} analysis={item} product={item.product} />
            ))}
          </div>
        )}

        {results.length === 0 && q.trim() && (
          <div className="text-center py-16">
            <p className="text-sm text-text-muted">
              &ldquo;{q}&rdquo; ile eşleşen bir analiz yok.
            </p>
          </div>
        )}

        {results.length === 0 && !q.trim() && (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Radar className="w-8 h-8 text-text-muted mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-base mb-2">
              Henüz hiçbir ürün taramadın.
            </h2>
            <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
              İlk Trendyol linkini yapıştır, radar müşterinin ne dediğini göstersin.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-signal text-ink font-display font-bold text-sm px-5 py-2.5 rounded-lg hover:brightness-110 transition"
            >
              Taramayı başlat
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
