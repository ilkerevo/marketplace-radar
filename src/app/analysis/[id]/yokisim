import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AnalysisReport } from "@/components/analysis-report"
import type { Analysis, Product } from "@/types/database.types"

interface PageProps {
  // Next.js 15'te params Promise'tir. Next 14 kullanıyorsan
  // `params: { id: string }` yapıp `await` satırını kaldırman yeterli.
  params: Promise<{ id: string }>
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("analyses")
    .select("*, product:products(*)")
    .eq("id", id)
    .single()

  if (error || !data) {
    notFound()
  }

  const { product, ...analysis } = data as Analysis & { product: Product }

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
