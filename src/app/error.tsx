"use client"

import { useEffect } from "react"
import Link from "next/link"
import { TriangleAlert } from "lucide-react"

/**
 * Bir route segment'i (herhangi bir sayfa) render sırasında beklenmeyen bir
 * hata fırlatırsa Next.js bunun yerine bu component'i gösterir — Next'in
 * varsayılan çirkin "Application error: a server-side exception has occurred"
 * ekranı yerine.
 *
 * NOT: Bu sadece kendi route segment'inin ALTINDAKİ hataları yakalar.
 * Root layout'ta (Navbar gibi her sayfada render edilen bileşenlerde)
 * fırlatılan hatalar burada YAKALANMAZ — onun için global-error.tsx var.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[error.tsx] Yakalanan hata:", error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <TriangleAlert className="w-10 h-10 text-negative mb-4" strokeWidth={1.5} />
      <h1 className="font-display text-xl font-bold mb-2">Bir şeyler ters gitti.</h1>
      <p className="text-sm text-text-muted mb-8 max-w-sm">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek genelde çözer.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-signal text-ink font-display font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition"
        >
          Tekrar dene
        </button>
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-text-primary transition underline underline-offset-4"
        >
          Ana sayfa
        </Link>
      </div>
    </main>
  )
}
