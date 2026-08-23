"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CircleCheck, CircleX, TriangleAlert, X } from "lucide-react"

type PaymentStatus = "success" | "failed" | "error" | "already_processed"

const BANNER_CONFIG: Record<
  PaymentStatus,
  { text: string; tone: "positive" | "negative" | "warning"; icon: typeof CircleCheck }
> = {
  success: {
    text: "Ödeme alındı, kredilerin hesabına eklendi.",
    tone: "positive",
    icon: CircleCheck,
  },
  already_processed: {
    text: "Bu ödeme zaten işlendi, kredilerin hesabında.",
    tone: "positive",
    icon: CircleCheck,
  },
  failed: {
    text: "Ödeme tamamlanamadı. Kartından ücret çekilmedi.",
    tone: "negative",
    icon: CircleX,
  },
  error: {
    text: "Ödeme alındı ama kredi eklenirken bir sorun oluştu. Destek ekibiyle iletişime geç.",
    tone: "warning",
    icon: TriangleAlert,
  },
}

const TONE_STYLES = {
  positive: "text-positive border-positive/20 bg-positive/10",
  negative: "text-negative border-negative/20 bg-negative/10",
  warning: "text-warning border-warning/20 bg-warning/10",
}

export function PaymentBanner({ status }: { status?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(!!status)

  useEffect(() => {
    setVisible(!!status)
  }, [status])

  if (!visible || !status || !(status in BANNER_CONFIG)) return null

  const config = BANNER_CONFIG[status as PaymentStatus]
  const Icon = config.icon

  function dismiss() {
    setVisible(false)
    // URL'den query'yi temizle — sayfa yenilendiğinde banner tekrar çıkmasın
    router.replace(pathname)
  }

  return (
    <div
      className={`flex items-center gap-3 text-sm rounded-lg px-4 py-3 border mb-6 animate-log-in ${TONE_STYLES[config.tone]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{config.text}</span>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition"
        aria-label="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
