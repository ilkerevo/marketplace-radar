import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Bilerek okunaklı bir hata fırlatıyoruz — bu satır olmasa Supabase
    // client'ı içeride anlaşılması güç bir "Invalid URL" hatası fırlatır.
    // Bu hatayı yakalayacak yer, bu fonksiyonu çağıran component'in
    // kendi try/catch'i (bkz. Navbar, sayfa component'leri).
    throw new Error(
      "Supabase env variable'ları eksik: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Vercel > Project > Settings > Environment Variables kontrol edilmeli."
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component içinden çağrıldıysa (middleware yoksa) bu satır
          // hata verebilir — middleware session'ı zaten yeniliyorsa güvenle yok sayılabilir.
        }
      },
    },
  })
}
