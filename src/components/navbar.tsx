import Link from "next/link"
import { Radar, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { signOutAction } from "@/app/actions/auth"

interface NavbarState {
  user: { id: string; email: string | null } | null
  credits: number | null
}

/**
 * Navbar'ın veri ihtiyacını ayrı bir fonksiyonda topluyoruz ki
 * try/catch tek bir yerden tüm olası hata noktalarını (env eksikliği,
 * Supabase'e ulaşılamaması, sorgu hatası) yakalayabilsin.
 */
async function getNavbarState(): Promise<NavbarState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, credits: null }
  }

  const { data } = await supabase
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .single()

  return {
    user: { id: user.id, email: user.email ?? null },
    credits: data?.credits ?? null,
  }
}

export async function Navbar() {
  let state: NavbarState = { user: null, credits: null }
  let hasError = false

  try {
    state = await getNavbarState()
  } catch (err) {
    // Env variable eksik/yanlış ya da Supabase'e ulaşılamıyor olabilir.
    // Navbar tüm sayfalarda (root layout'ta) render edildiği için burada
    // fırlatılan bir hata SİTENİN TAMAMINI çökertir — bu yüzden asla
    // dışarı fırlatmıyoruz, çıkış yapılmamış görünümüne düşüyoruz.
    console.error(
      "[Navbar] Kullanıcı/kredi bilgisi alınamadı, çıkış yapılmamış görünüm gösteriliyor:",
      err
    )
    hasError = true
  }

  const { user, credits } = state

  return (
    <nav className="w-full border-b border-border">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-signal" strokeWidth={1.75} />
          <span className="font-display font-medium tracking-wide text-sm text-text-muted uppercase">
            Marketplace Radar
          </span>
        </Link>

        {hasError && (
          <span className="hidden sm:block text-[11px] font-mono text-warning">
            Bağlantı sorunu — bazı özellikler geçici olarak kısıtlı
          </span>
        )}

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden sm:block text-xs font-medium text-text-muted hover:text-signal transition"
            >
              Panel
            </Link>
            {credits !== null && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-warning bg-warning/10 border border-warning/20 rounded-full px-3 py-1.5">
                <Zap className="w-3 h-3 fill-warning" />
                {credits} kredi
              </span>
            )}
            <span className="hidden sm:block text-xs text-text-muted font-mono">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-xs font-medium text-text-muted hover:text-negative transition border border-border hover:border-negative/40 rounded-lg px-3.5 py-2"
              >
                Çıkış yap
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-display font-bold bg-signal text-ink rounded-lg px-4 py-2 hover:brightness-110 transition"
          >
            Giriş yap
          </Link>
        )}
      </div>
    </nav>
  )
}
