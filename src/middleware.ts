import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

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
