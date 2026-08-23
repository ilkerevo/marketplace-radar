"use server"

import { redirect } from "next/navigation"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getIyzico } from "@/lib/payment/iyzico-client"
import { getCreditPackage } from "@/lib/payment/packages"
import { getUserIp } from "@/lib/get-user-ip"

export async function initiateCheckoutAction(packageId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/pricing`)
  }

  const pkg = getCreditPackage(packageId)
  if (!pkg) {
    redirect("/pricing?payment=invalid_package")
  }

  const userIp = await getUserIp()

  const admin = createAdminClient()
  const conversationId = crypto.randomUUID()

  const { error: insertError } = await admin.from("payments").insert({
    user_id: user.id,
    package_id: pkg.id,
    credits: pkg.credits,
    amount: pkg.priceTRY,
    currency: "TRY",
    status: "PENDING",
    provider: "iyzico",
    conversation_id: conversationId,
  })

  if (insertError) {
    console.error("Payment kaydı oluşturulamadı:", insertError)
    redirect("/pricing?payment=checkout_failed")
  }

  const iyzipay = getIyzico()

  let paymentPageUrl: string
  try {
    paymentPageUrl = await new Promise<string>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(
        {
          locale: "tr",
          conversationId,
          price: pkg.priceTRY.toFixed(2),
          paidPrice: pkg.priceTRY.toFixed(2),
          currency: "TRY",
          basketId: conversationId,
          paymentGroup: "PRODUCT",
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/iyzico/callback`,
          enabledInstallments: [1, 2, 3, 6, 9],
          buyer: {
            id: user.id,
            name: (user.user_metadata?.name as string) || "Marketplace",
            surname: (user.user_metadata?.surname as string) || "Radar",
            gsmNumber: "+905000000000",
            email: user.email!,
            // ÖNEMLİ: iyzico yasal olarak identityNumber (TC Kimlik No) ve gerçek
            // adres/IP ister. Aşağıdaki değerler sandbox testi için placeholder —
            // canlıya çıkmadan önce bunları gerçek bir checkout formunda kullanıcıdan
            // toplaman gerekiyor. Bkz. deployment-checklist.md Bölüm 3.2.
            identityNumber: "11111111111",
            registrationAddress: "Türkiye",
            ip: userIp,
            city: "Istanbul",
            country: "Turkey",
          },
          shippingAddress: {
            contactName: user.email!,
            city: "Istanbul",
            country: "Turkey",
            address: "Dijital ürün — fiziksel teslimat yok",
          },
          billingAddress: {
            contactName: user.email!,
            city: "Istanbul",
            country: "Turkey",
            address: "Dijital ürün — fiziksel teslimat yok",
          },
          basketItems: [
            {
              id: pkg.id,
              name: `${pkg.name} Kredi Paketi (${pkg.credits} kredi)`,
              category1: "Dijital Kredi",
              itemType: "VIRTUAL",
              price: pkg.priceTRY.toFixed(2),
            },
          ],
        },
        (err, result) => {
          if (err) return reject(err)
          if (result?.status !== "success" || !result?.paymentPageUrl) {
            return reject(new Error(result?.errorMessage || "iyzico başlatma hatası"))
          }
          resolve(result.paymentPageUrl)
        }
      )
    })
  } catch (err) {
    console.error("iyzico checkout başlatma hatası:", err)
    redirect("/pricing?payment=checkout_failed")
  }

  redirect(paymentPageUrl)
}
