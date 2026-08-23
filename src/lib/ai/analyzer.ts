import type { Json } from "@/types/database.types"

// ---- Tipler ----
export interface ReviewInput {
  author?: string
  rating: number
  text: string
  date?: string
}

export interface AnalysisResult {
  positivePoints: string[]
  negativePoints: string[]
  frequentWords: { word: string; count: number }[]
  buyerPersona: string
  actionableTips: string[]
  sentimentScore: number // -1 ile 1 arası
  summary: string
}

// Supabase'e yazılacak satırla birebir eşleşen tip
export interface AnalysisRecord {
  positive_points: Json
  negative_points: Json
  frequent_words: Json
  buyer_persona: string
  actionable_tips: Json
  sentiment_score: number
  summary: string
}

const ANALYSIS_SYSTEM_PROMPT = `Sen bir e-ticaret ürün yorumu analiz uzmanısın. Sana bir ürüne ait müşteri yorumları verilecek.

Görevin, yorumları analiz edip SADECE aşağıdaki JSON formatında yanıt vermek. Başka hiçbir açıklama, markdown ya da kod bloğu ekleme:

{
  "positivePoints": ["madde1", "madde2", ...],
  "negativePoints": ["madde1", "madde2", ...],
  "frequentWords": [{"word": "kelime", "count": sayı}, ...],
  "buyerPersona": "Bu ürünü kimin, neden aldığına dair 2-3 cümlelik profil",
  "actionableTips": ["satıcı için uygulanabilir öneri1", "öneri2", ...],
  "sentimentScore": -1 ile 1 arasında ondalıklı sayı (negatif=-1, pozitif=1),
  "summary": "Yorumların genel özeti, 3-4 cümle"
}

Kurallar:
- positivePoints ve negativePoints: en az 3, en fazla 7 madde
- frequentWords: yorumlarda en çok geçen 5-10 anlamlı kelime (stop word'leri hariç tut)
- actionableTips: somut, uygulanabilir öneriler olsun, genel geçer laf kalabalığı olmasın
- Tüm çıktı Türkçe olmalı
- Yorumlar yetersizse veya boşsa bile geçerli JSON döndür, alanları makul varsayılan değerlerle doldur`

/**
 * Ürün yorumlarını Claude API ile analiz eder.
 * Kredi düşme işlemi bu fonksiyonun ÇAĞRILDIĞI yerde (route handler / server action)
 * yapılmalı — bu fonksiyon sadece analiz mantığından sorumlu.
 */
export async function analyzeReviews(
  productTitle: string,
  reviews: ReviewInput[]
): Promise<AnalysisResult> {
  if (!reviews || reviews.length === 0) {
    throw new Error("Analiz için en az bir yorum gerekli.")
  }

  const reviewsText = reviews
    .map((r, i) => `${i + 1}. [${r.rating}/5] ${r.text}`)
    .join("\n")

  const userPrompt = `Ürün: ${productTitle}
Toplam yorum sayısı: ${reviews.length}

Yorumlar:
${reviewsText}

Yukarıdaki yorumları analiz et ve sistem promptunda belirtilen JSON formatında yanıt ver.`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude API hatası (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text"
  )

  if (!textBlock?.text) {
    throw new Error("Claude API'den beklenen metin yanıtı alınamadı.")
  }

  return parseAnalysisResponse(textBlock.text)
}

/**
 * Modelin döndürdüğü metni güvenli şekilde JSON'a çevirir.
 * Model bazen ```json fence'i ekleyebilir, onu temizler.
 */
function parseAnalysisResponse(rawText: string): AnalysisResult {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Model yanıtı geçerli JSON formatında değil.")
  }

  return validateAnalysisResult(parsed)
}

function validateAnalysisResult(data: unknown): AnalysisResult {
  const d = data as Record<string, unknown>

  if (
    !Array.isArray(d.positivePoints) ||
    !Array.isArray(d.negativePoints) ||
    !Array.isArray(d.frequentWords) ||
    !Array.isArray(d.actionableTips) ||
    typeof d.buyerPersona !== "string" ||
    typeof d.summary !== "string" ||
    typeof d.sentimentScore !== "number"
  ) {
    throw new Error("Model yanıtı beklenen şemaya uymuyor.")
  }

  return {
    positivePoints: d.positivePoints as string[],
    negativePoints: d.negativePoints as string[],
    frequentWords: d.frequentWords as { word: string; count: number }[],
    buyerPersona: d.buyerPersona,
    actionableTips: d.actionableTips as string[],
    sentimentScore: Math.max(-1, Math.min(1, d.sentimentScore)),
    summary: d.summary,
  }
}

/**
 * AnalysisResult'ı Supabase 'analyses' tablosuna yazılacak satır formatına çevirir.
 */
export function toAnalysisRecord(result: AnalysisResult): AnalysisRecord {
  return {
    positive_points: result.positivePoints as unknown as Json,
    negative_points: result.negativePoints as unknown as Json,
    frequent_words: result.frequentWords as unknown as Json,
    buyer_persona: result.buyerPersona,
    actionable_tips: result.actionableTips as unknown as Json,
    sentiment_score: result.sentimentScore,
    summary: result.summary,
  }
}
