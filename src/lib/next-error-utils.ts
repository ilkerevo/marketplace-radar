/**
 * next/navigation'daki redirect() ve notFound() fonksiyonları, Next.js'in
 * kendi routing mekanizmasının yakalaması için özel bir "digest" alanı taşıyan
 * hata fırlatır (NEXT_REDIRECT / NEXT_NOT_FOUND). Sayfa component'lerinde
 * genel bir try/catch kullanırken bu hataları YANLIŞLIKLA yutmamak kritik —
 * yutulursa redirect/notFound çalışmaz, kullanıcı olması gereken sayfaya
 * gitmez. Bu yardımcı, catch bloklarında "bu gerçek bir hata mı, yoksa
 * Next.js'in kontrol akışı mı" ayrımını yapar.
 */
export function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false
  }
  const digest = (error as { digest?: unknown }).digest
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
  )
}
