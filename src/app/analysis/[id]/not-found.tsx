import Link from "next/link"
import { Radar } from "lucide-react"

export default function AnalysisNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Radar className="w-10 h-10 text-text-muted mb-4" strokeWidth={1.5} />
      <h1 className="font-display text-xl font-bold mb-2">Bu analiz bulunamadı.</h1>
      <p className="text-sm text-text-muted mb-8 max-w-sm">
        Link hatalı olabilir ya da analiz silinmiş olabilir.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-surface-raised border border-border hover:border-signal/50 px-5 py-2.5 rounded-lg font-display text-sm font-medium transition"
      >
        Yeni tarama başlat
      </Link>
    </main>
  )
}
