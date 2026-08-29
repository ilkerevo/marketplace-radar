import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AnalysisReport } from "@/components/analysis-report"
import type { Analysis, Product } from "@/types/database.types"
import { isNextControlFlowError } from "@/lib/next-error-utils"

interface PageProps {
  // Next.js 15'te params Promise'tir. Next 14 kullanıyorsan
  // `params: { id: string }` yapıp `await` satırını kaldırman yeterli.
  params: Promise<{ id: string }>
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params

  let analysis: Analysis
  let product: Product

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("analyses")
      .select("*, product:products(*)")
      .eq("id", id)
      .single()

    if (error || !data) {
      notFound() // NEXT_NOT_FOUND fırlatır — aşağıdaki catch'te yeniden fırlatılır
    }

    const { product: p, ...a } = data as Analysis & { product: Product }
    analysis = a
    product = p
  } catch (err) {
    // notFound()'un fırlattığı NEXT_NOT_FOUND'u yutmamak kritik — bu durumda
    // Next.js'in kendi not-found.tsx'i devreye girsin diye yeniden fırlatıyoruz.
    if (isNextControlFlowError(err)) throw err

    // Buraya düşülüyorsa gerçek bir bağlantı/konfigürasyon sorunu var
    // (env eksik, Supabase'e ulaşılamıyor vb.) — "bulunamadı" demek yanıltıcı
    // olur, bunun yerine ayrı ve doğru bir mesaj gösteriyoruz.
    console.error("[AnalysisPage] Analiz yüklenemedi:", err)

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-xl font-bold mb-2">Analiz şu an yüklenemiyor.</h1>
        <p className="text-sm text-text-muted mb-8 max-w-sm">
          Geçici bir bağlantı sorunu olabilir. Birkaç dakika sonra tekrar dene.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-surface-raised border border-border hover:border-signal/50 px-5 py-2.5 rounded-lg font-display text-sm font-medium transition"
        >
          Ana sayfaya dön
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-xs font-mono text-text-muted hover:text-signal transition inline-flex items-center gap-1.5 mb-8"
        >
          ← Yeni tarama
        </Link>
        <AnalysisReport analysis={analysis} product={product} />
      </div>
    </main>
  )
}
