import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Env variable'lar Vercel'de eksik/boş set edilmişse (yanlış environment'a
  // eklenmiş, typo yapılmış, deploy preview'inde tanımsız kalmış vb.)
  // middleware'in tüm siteyi 500'e düşürmesini engelle — bunun yerine
  // isteği olduğu gibi geçir ve sunucu logunda net bir uyarı bırak.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY tanımsız. " +
        "Vercel > Project > Settings > Environment Variables kontrol edilmeli. " +
        "Auth koruması bu istek için devre dışı bırakıldı."
    )
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // ÖNEMLİ: getUser() çağrısı session'ı yeniler.
    // Bu satırı silme, aksi halde kullanıcılar rastgele logout olabilir.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Korumalı rotalar — auth yoksa login'e yönlendir.
    // /analysis bilinçli olarak listede DEĞİL: paylaşılabilir/public kalması
    // viral büyüme stratejisi olarak onaylandı.
    const protectedPaths = ["/dashboard", "/pricing"]
    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Giriş yapmış kullanıcı login sayfasına giderse dashboard'a at
    if (request.nextUrl.pathname === "/login" && user) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (err) {
    // Supabase client'ı oluşturulurken veya auth çağrısında beklenmeyen bir
    // hata olursa (network, geçici Supabase kesintisi vb.) siteyi 500'e
    // düşürmek yerine isteği auth kontrolü olmadan geçir. Kullanıcı bu
    // durumda korumalı sayfalarda login'e yönlendirilmeyebilir — ama site
    // çökmez. Loglanan hata Vercel Functions sekmesinden takip edilebilir.
    console.error("[middleware] Beklenmeyen hata, istek auth kontrolü olmadan geçiriliyor:", err)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Şunlar hariç tüm route'larda çalış:
     * - _next/static, _next/image (statik dosyalar)
     * - favicon.ico
     * - resim uzantıları
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
