import { headers } from "next/headers"

/**
 * İstemcinin gerçek IP adresini alır. Vercel/çoğu proxy arkasında çalışan
 * Next.js uygulamalarında `request.ip` App Router Server Action'larda
 * doğrudan erişilebilir değil — bu yüzden proxy header'larından okunur.
 *
 * Öncelik sırası:
 * 1. x-forwarded-for (Vercel/çoğu reverse proxy bunu standart olarak ekler,
 *    değer "client, proxy1, proxy2" formatında olabilir — ilk IP gerçek istemcidir)
 * 2. x-real-ip (bazı proxy'ler bunu kullanır)
 * 3. Fallback: iyzico sandbox'ın kabul ettiği placeholder IP
 */
export async function getUserIp(): Promise<string> {
  const headersList = await headers()

  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = headersList.get("x-real-ip")
  if (realIp) return realIp.trim()

  // Lokal geliştirmede header'lar boş gelir — iyzico sandbox test IP'si.
  // Prod'da bu satıra düşülmesi loglanmalı, çünkü gerçek IP alınamadığı anlamına gelir.
  console.warn("getUserIp(): x-forwarded-for / x-real-ip header'ı bulunamadı, fallback IP kullanılıyor.")
  return "85.34.78.112"
}
