import { CREDIT_PACKAGES } from "@/lib/payment/packages"
import { initiateCheckoutAction } from "@/app/actions/checkout"
import { Check, Zap } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ payment?: string }>
}

const PAYMENT_MESSAGES: Record<string, { text: string; tone: "negative" | "warning" }> = {
  failed: { text: "Ödeme tamamlanamadı. Kartın çekilmedi.", tone: "negative" },
  checkout_failed: { text: "Ödeme başlatılamadı. Tekrar dener misin?", tone: "negative" },
  error: {
    text: "Ödeme alındı ama kredi eklenirken bir sorun oluştu. Destek ekibiyle iletişime geç.",
    tone: "warning",
  },
  invalid_package: { text: "Geçersiz paket seçimi.", tone: "negative" },
}

export default async function PricingPage({ searchParams }: PageProps) {
  const { payment } = await searchParams
  const message = payment ? PAYMENT_MESSAGES[payment] : undefined

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
          Radarını güçlendir.
        </h1>
        <p className="text-text-muted max-w-md mx-auto">
          Kredi bitmez, sadece dolar. İhtiyacın kadar al, istediğin zaman kullan.
        </p>
      </div>

      {message && (
        <div
          className={`max-w-md mx-auto mb-8 text-center text-sm rounded-lg px-4 py-3 border ${
            message.tone === "negative"
              ? "text-negative border-negative/20 bg-negative/10"
              : "text-warning border-warning/20 bg-warning/10"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative flex flex-col rounded-xl p-6 border ${
              pkg.highlight
                ? "border-signal bg-surface-raised shadow-[0_0_0_1px_rgba(76,214,224,0.3)]"
                : "border-border bg-surface"
            }`}
          >
            {pkg.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-signal text-ink text-[10px] font-display font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                En çok tercih edilen
              </span>
            )}

            <h2 className="font-display font-bold text-lg mb-1">{pkg.name}</h2>
            <p className="text-xs text-text-muted mb-5 min-h-[32px]">{pkg.description}</p>

            <div className="mb-1 font-mono text-3xl font-bold">
              ₺{pkg.priceTRY.toLocaleString("tr-TR")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-6">
              <Zap className="w-3.5 h-3.5 text-warning fill-warning" />
              {pkg.credits} kredi · ₺{(pkg.priceTRY / pkg.credits).toFixed(1)} / analiz
            </div>

            <ul className="space-y-2 mb-6 text-sm text-text-primary flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-positive shrink-0" />
                {pkg.credits} ürün analizi
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-positive shrink-0" />
                Kredi son kullanma tarihi yok
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-positive shrink-0" />
                Trendyol analiz desteği
              </li>
            </ul>

            <form action={initiateCheckoutAction.bind(null, pkg.id)}>
              <button
                type="submit"
                className={`w-full font-display font-bold py-3 rounded-lg transition ${
                  pkg.highlight
                    ? "bg-signal text-ink hover:brightness-110"
                    : "bg-surface-raised border border-border hover:border-signal/50 text-text-primary"
                }`}
              >
                Satın al
              </button>
            </form>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-text-muted mt-10 font-mono">
        Ödemeler iyzico güvencesiyle işlenir. Kart bilgin bizde saklanmaz.
      </p>
    </main>
  )
}
