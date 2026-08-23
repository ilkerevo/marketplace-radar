import { NextRequest, NextResponse } from "next/server"
import { getIyzico } from "@/lib/payment/iyzico-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const formData = await request.formData()
  const token = formData.get("token")?.toString()

  if (!token) {
    return NextResponse.redirect(`${appUrl}/pricing?payment=failed`)
  }

  const iyzipay = getIyzico()
  const admin = createAdminClient()

  const result = await new Promise<any>((resolve) => {
    iyzipay.checkoutForm.retrieve({ locale: "tr", token }, (err, res) => {
      if (err) {
        console.error("iyzico retrieve hatası:", err)
        return resolve(null)
      }
      resolve(res)
    })
  })

  if (!result || result.status !== "success") {
    return NextResponse.redirect(`${appUrl}/pricing?payment=failed`)
  }

  const { data: paymentRow, error: fetchError } = await admin
    .from("payments")
    .select("id, user_id, credits, status")
    .eq("conversation_id", result.conversationId)
    .single()

  if (fetchError || !paymentRow) {
    console.error("Payment kaydı bulunamadı:", result.conversationId, fetchError)
    return NextResponse.redirect(`${appUrl}/pricing?payment=failed`)
  }

  // İdempotency: iyzico callback'i birden fazla tetiklerse (retry, çift POST vb.)
  // krediyi ikinci kez ekleme.
  if (paymentRow.status === "SUCCESS") {
    return NextResponse.redirect(`${appUrl}/dashboard?payment=already_processed`)
  }

  if (result.paymentStatus !== "SUCCESS") {
    await admin
      .from("payments")
      .update({
        status: "FAILED",
        provider_payment_id: result.paymentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id)

    return NextResponse.redirect(`${appUrl}/pricing?payment=failed`)
  }

  const { error: creditError } = await admin.rpc("increment_user_credits", {
    p_user_id: paymentRow.user_id,
    p_amount: paymentRow.credits,
  })

  if (creditError) {
    console.error("Kredi eklenemedi:", creditError)
    // Bilerek status'ü SUCCESS yapmıyoruz ki bu durum fark edilip
    // manuel müdahale edilsin (kullanıcı parayı ödedi ama kredi düşmedi).
    return NextResponse.redirect(`${appUrl}/pricing?payment=error`)
  }

  await admin
    .from("payments")
    .update({
      status: "SUCCESS",
      provider_payment_id: result.paymentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentRow.id)

  return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
}
