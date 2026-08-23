import type { ReviewInput } from "@/lib/ai/analyzer"

// ---- Trendyol API yanıt tipleri (gözlemlenen yapı — değişebilir) ----
interface TrendyolReviewRaw {
  id: number
  comment: string
  rate: number
  commentDateISOtype: string
  userFullName?: string
}

interface TrendyolReviewsApiResponse {
  result?: {
    productReviews?: {
      content: TrendyolReviewRaw[]
      totalElements: number
    }
  }
}

// Product detail endpoint yanıt yapısı (gözlemlenen — değişebilir)
interface TrendyolProductDetailApiResponse {
  result?: {
    name?: string
    brand?: { name?: string }
    ratingScore?: {
      averageRating?: number
      totalRatingCount?: number
      totalCommentCount?: number
    }
    images?: string[]
  }
}

export interface ScrapedProductMeta {
  contentId: string
  title: string
  imageUrl: string | null
  rating: number | null
  totalReviews: number | null
}

const BASE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.trendyol.com/",
  Origin: "https://www.trendyol.com",
}

/**
 * Trendyol ürün URL'sinden content ID (ürün ID) çıkarır.
 * Örnek URL: https://www.trendyol.com/marka/urun-adi-p-123456789
 */
export function extractContentId(productUrl: string): string | null {
  const match = productUrl.match(/-p-(\d+)/)
  return match ? match[1] : null
}

function normalizeContentId(productUrlOrId: string): string {
  const contentId = /^\d+$/.test(productUrlOrId)
    ? productUrlOrId
    : extractContentId(productUrlOrId)

  if (!contentId) {
    throw new Error(
      "Geçerli bir Trendyol ürün ID'si bulunamadı. URL formatını kontrol edin (örn: .../urun-p-123456789)."
    )
  }
  return contentId
}

/**
 * Trendyol'un review API'sinden ham yorumları çeker.
 * NOT: Endpoint yapısı Trendyol tarafında değişebilir — çalışmazsa
 * tarayıcı DevTools > Network sekmesinden ürün sayfasında "review"
 * araması yaparak güncel endpoint'i teyit et.
 */
async function fetchReviewPage(
  contentId: string,
  page: number
): Promise<TrendyolReviewsApiResponse> {
  const url = `https://public-mdc.trendyol.com/discovery-web-socialgw-service/api/review/${contentId}?page=${page}&order=DESC&orderBy=Score`

  const response = await fetch(url, {
    headers: BASE_HEADERS,
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(
      `Trendyol review API isteği başarısız (status: ${response.status}). Endpoint değişmiş olabilir.`
    )
  }

  return response.json()
}

/**
 * Trendyol'un ürün detay API'sinden başlık, görsel ve rating bilgisini çeker.
 * NOT: Bu endpoint de review endpoint'i gibi resmi/dokümante değildir — sitenin
 * kendi frontend'inin kullandığı iç API'ye dayanır ve DevTools ile teyit edilmeli.
 */
async function fetchProductDetail(
  contentId: string
): Promise<TrendyolProductDetailApiResponse> {
  const url = `https://public-mdc.trendyol.com/discovery-web-productgw-service/api/productDetail/${contentId}`

  const response = await fetch(url, {
    headers: BASE_HEADERS,
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(
      `Trendyol product detail API isteği başarısız (status: ${response.status}). Endpoint değişmiş olabilir.`
    )
  }

  return response.json()
}

/**
 * Metni temizler: fazla boşluk, kontrol karakterleri.
 */
function cleanReviewText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
}

/**
 * Trendyol ürün URL'si veya doğrudan content ID vererek yorumları çeker.
 *
 * @param productUrlOrId - Tam Trendyol ürün URL'si veya sayısal content ID
 * @param maxReviews - Çekilecek maksimum yorum sayısı (varsayılan: 50)
 */
export async function scrapeTrendyolReviews(
  productUrlOrId: string,
  maxReviews = 50
): Promise<ReviewInput[]> {
  const contentId = normalizeContentId(productUrlOrId)

  const reviews: ReviewInput[] = []
  const PAGE_SIZE = 20
  let page = 0
  let totalElements = Infinity

  while (reviews.length < maxReviews && page * PAGE_SIZE < totalElements) {
    let data: TrendyolReviewsApiResponse
    try {
      data = await fetchReviewPage(contentId, page)
    } catch (err) {
      if (page === 0) throw err
      break
    }

    const reviewBlock = data.result?.productReviews
    if (!reviewBlock || reviewBlock.content.length === 0) break

    totalElements = reviewBlock.totalElements

    for (const raw of reviewBlock.content) {
      if (!raw.comment || raw.comment.trim().length < 3) continue

      reviews.push({
        author: raw.userFullName ?? undefined,
        rating: raw.rate,
        text: cleanReviewText(raw.comment),
        date: raw.commentDateISOtype,
      })

      if (reviews.length >= maxReviews) break
    }

    page++

    if (page * PAGE_SIZE < totalElements && reviews.length < maxReviews) {
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300))
    }
  }

  if (reviews.length === 0) {
    throw new Error(
      "Bu ürün için yorum bulunamadı veya Trendyol API yanıt vermedi."
    )
  }

  return reviews
}

/**
 * Ürün başlığı, görsel URL'i, ortalama puan ve toplam yorum sayısını çeker.
 * Product detail endpoint'i başarısız olursa review endpoint'inden
 * en azından toplam yorum sayısına düşer (graceful fallback).
 */
export async function scrapeTrendyolProductMeta(
  productUrlOrId: string
): Promise<ScrapedProductMeta> {
  const contentId = normalizeContentId(productUrlOrId)

  try {
    const data = await fetchProductDetail(contentId)
    const result = data.result

    if (!result?.name) {
      throw new Error("Product detail yanıtı beklenen alanları içermiyor.")
    }

    return {
      contentId,
      title: result.brand?.name
        ? `${result.brand.name} ${result.name}`
        : result.name,
      imageUrl: result.images?.[0]
        ? `https://cdn.dsmcdn.com${result.images[0]}`
        : null,
      rating: result.ratingScore?.averageRating ?? null,
      totalReviews:
        result.ratingScore?.totalCommentCount ??
        result.ratingScore?.totalRatingCount ??
        null,
    }
  } catch (err) {
    console.warn(
      `Trendyol product detail alınamadı (contentId: ${contentId}), review endpoint'ine düşülüyor:`,
      err
    )

    // Fallback: sadece review endpoint'inden toplam yorum sayısını al
    const reviewData = await fetchReviewPage(contentId, 0)
    const reviewBlock = reviewData.result?.productReviews

    return {
      contentId,
      title: `Trendyol Ürün #${contentId}`,
      imageUrl: null,
      rating: null,
      totalReviews: reviewBlock?.totalElements ?? null,
    }
  }
}
