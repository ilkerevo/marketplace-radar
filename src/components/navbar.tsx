import Link from "next/link"
import { Radar, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { signOutAction } from "@/app/actions/auth"

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let credits: number | null = null
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()
    credits = data?.credits ?? null
  }

  return (
    <nav className="w-full border-b border-border">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-signal" strokeWidth={1.75} />
          <span className="font-display font-medium tracking-wide text-sm text-text-muted uppercase">
            Marketplace Radar
          </span>
        </Link>

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
