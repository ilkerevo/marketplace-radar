"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { analyzeReviews, toAnalysisRecord } from "@/lib/ai/analyzer"
import {
  scrapeTrendyolReviews,
  scrapeTrendyolProductMeta,
} from "@/lib/scraper/trendyol"
import { revalidatePath } from "next/cache"

export type AnalyzeActionResult =
  | {
      success: false
      error: string
      code: "UNAUTHORIZED" | "NO_CREDITS" | "SCRAPE_FAILED" | "ANALYSIS_FAILED" | "DB_ERROR"
    }
// Not: başarı durumunda fonksiyon değer DÖNMÜYOR — doğrudan /analysis/[id]'e
// yönlendiriyor. Bu tip sadece hata dallarını temsil ediyor.

interface AnalyzeInput {
  productUrl: string
  marketplace: "trendyol" // MVP: şimdilik sadece Trendyol destekleniyor
}

export async function analyzeProductAction(
  input: AnalyzeInput
): Promise<AnalyzeActionResult> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: "Bu işlem için giriş yapmalısınız.", code: "UNAUTHORIZED" }
  }

  const { data: userRow, error: userFetchError } = await supabase
    .from("users")
    .select("id, credits")
    .eq("id", authUser.id)
    .single()

  if (userFetchError || !userRow) {
    return { success: false, error: "Kullanıcı bilgisi alınamadı.", code: "DB_ERROR" }
  }

  if (userRow.credits < 1) {
    return {
      success: false,
      error: "Yeterli krediniz yok. Lütfen planınızı yükseltin.",
      code: "NO_CREDITS",
    }
  }

  let productMeta
  let reviews
  try {
    if (input.marketplace !== "trendyol") {
      throw new Error("Şu an sadece Trendyol destekleniyor.")
    }
    productMeta = await scrapeTrendyolProductMeta(input.productUrl)
    reviews = await scrapeTrendyolReviews(input.productUrl, 50)
  } catch (err) {
    console.error("Scraping hatası:", err)
    return {
      success: false,
      error: err instanceof Error ? `Ürün verisi çekilemedi: ${err.message}` : "Ürün verisi çekilemedi.",
      code: "SCRAPE_FAILED",
    }
  }

  let newAnalysisId: string

  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        marketplace: input.marketplace,
        product_url: input.productUrl,
        title: productMeta.title,
        rating: productMeta.rating,
        total_reviews: productMeta.totalReviews,
        user_id: authUser.id,
      })
      .select("id")
      .single()

    if (productError || !product) {
      throw new Error(`Ürün kaydedilemedi: ${productError?.message}`)
    }

    const analysisResult = await analyzeReviews(productMeta.title, reviews)
    const analysisRecord = toAnalysisRecord(analysisResult)

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({ product_id: product.id, ...analysisRecord })
      .select("id")
      .single()

    if (analysisError || !analysis) {
      throw new Error(`Analiz kaydedilemedi: ${analysisError?.message}`)
    }

    const { error: creditError } = await supabase
      .from("users")
      .update({ credits: userRow.credits - 1 })
      .eq("id", authUser.id)
      .gte("credits", 1)

    if (creditError) {
      // Kritik değil — analiz zaten kaydedildi, sadece logla
      console.error("Kredi düşme hatası:", creditError)
    }

    newAnalysisId = analysis.id
  } catch (err) {
    console.error("Analiz işlemi hatası:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.",
      code: "ANALYSIS_FAILED",
    }
  }

  // try/catch DIŞINDA — redirect'in fırlattığı NEXT_REDIRECT burada yakalanmaz
  revalidatePath("/dashboard")
  redirect(`/analysis/${newAnalysisId}`)
}
