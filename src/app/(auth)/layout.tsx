import Link from "next/link"
import { Radar } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Radar className="w-5 h-5 text-signal" strokeWidth={1.75} />
        <span className="font-display font-medium tracking-wide text-sm text-text-muted uppercase">
          Marketplace Radar
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
