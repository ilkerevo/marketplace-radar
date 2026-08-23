"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search } from "lucide-react"

export function DashboardSearch({ initialQuery }: { initialQuery: string }) {
  const [value, setValue] = useState(initialQuery)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set("q", value.trim())
      } else {
        params.delete("q")
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300)

    return () => clearTimeout(handle)
  }, [value])

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ürün adına göre ara…"
        className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal/50 transition"
      />
    </div>
  )
}
