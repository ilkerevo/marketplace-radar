import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSearch } from "@/components/dashboard-search"
import { AnalysisListItem } from "@/components/analysis-list-item"
import { PaymentBanner } from "@/components/payment-banner"
import { Radar, ArrowRight, TriangleAlert } from "lucide-react"
import type { Product } from "@/types/database.types"
import { isNextControlFlowError } from "@/lib/next-error-utils"

interface PageProps {
  // Next 14 kullanıyorsan: `searchParams: { q?: string; payment?: string }` yap, await'i kaldır.
  searchParams: Promise<{ q?: string; payment?: string }>
}

type AnalysisRow = {
  id: string
  sentiment_score: number
  created_at: string
  product: Pick<Product, "title" | "marketplace" | "rating">
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { q = "", payment } = await searchParams

  let results: AnalysisRow[] = []
  let loadError = false

  try {
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

    const { data, error } = await query
    if (error) throw error

    results = (data ?? []) as unknown as AnalysisRow[]
  } catch (err) {
    // redirect()'in fırlattığı NEXT_REDIRECT'i yutmamak kritik — o durumda
    // hatayı tekrar fırlatıp Next.js'in yönlendirmeyi tamamlamasına izin veriyoruz.
    if (isNextControlFlowError(err)) throw err

    console.error("[DashboardPage] Analizler yüklenemedi:", err)
    loadError = true
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <PaymentBanner status={payment} />

        {loadError && (
          <div className="flex items-center gap-3 text-sm rounded-lg px-4 py-3 border mb-6 text-warning border-warning/20 bg-warning/10">
            <TriangleAlert className="w-4 h-4 shrink-0" />
            <span>Analizlerin şu an yüklenemedi. Birkaç dakika sonra sayfayı yenile.</span>
          </div>
        )}

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

        {!loadError && results.length > 0 && (
          <div className="space-y-3">
            {results.map((item) => (
              <AnalysisListItem key={item.id} analysis={item} product={item.product} />
            ))}
          </div>
        )}

        {!loadError && results.length === 0 && q.trim() && (
          <div className="text-center py-16">
            <p className="text-sm text-text-muted">
              &ldquo;{q}&rdquo; ile eşleşen bir analiz yok.
            </p>
          </div>
        )}

        {!loadError && results.length === 0 && !q.trim() && (
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
