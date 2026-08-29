/**
 * Node.js'in fetch implementasyonu (undici), ağ seviyesinde bir sorun olduğunda
 * genelde tek bir "fetch failed" mesajı veriyor — gerçek sebep (timeout, DNS,
 * TLS, bağlantı reddi, hedefin bağlantıyı kapatması) `error.cause` içinde saklı
 * kalıyor ve varsayılan olarak loglanmıyor. Bu yardımcı hem isteğe bir zaman
 * aşımı ekliyor hem de hatayı olabildiğince ayrıntılı loglayıp daha okunabilir
 * bir hata fırlatıyor.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  config: { timeoutMs?: number; label: string }
): Promise<Response> {
  const { timeoutMs = 10_000, label } = config

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const startedAt = Date.now()

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (err) {
    const elapsedMs = Date.now() - startedAt
    const isAbort = err instanceof Error && err.name === "AbortError"
    // undici'de gerçek network hatası `cause` alanında saklanır (örn. ECONNRESET,
    // ENOTFOUND, UND_ERR_CONNECT_TIMEOUT) — bunu loga basmazsak sadece
    // anlamsız "fetch failed" görürüz.
    const cause = err instanceof Error ? (err.cause as { code?: string; message?: string } | undefined) : undefined

    console.error(
      `[fetchWithTimeout] ${label} başarısız`,
      JSON.stringify({
        url,
        elapsedMs,
        isTimeout: isAbort,
        errorName: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        causeCode: cause?.code,
        causeMessage: cause?.message,
      })
    )

    if (isAbort) {
      throw new Error(`${label}: istek ${timeoutMs}ms içinde yanıt vermedi (zaman aşımı).`)
    }

    // causeCode varsa (örn. ENOTFOUND, ECONNREFUSED) hata mesajına ekle —
    // bu, "IP engeli mi yoksa geçici ağ sorunu mu" ayrımını loglardan
    // yapabilmek için kritik.
    const detail = cause?.code ? ` (${cause.code})` : ""
    throw new Error(`${label}: ağ isteği başarısız oldu${detail}.`)
  } finally {
    clearTimeout(timeoutId)
  }
}
