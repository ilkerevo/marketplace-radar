"use client"

import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"
import { signInAction, type AuthFormState } from "@/app/actions/auth"
import { TriangleAlert, ArrowRight } from "lucide-react"

const initialState: AuthFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-signal text-ink font-display font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 transition"
    >
      {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      {!pending && <ArrowRight className="w-4 h-4" />}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signInAction, initialState)

  return (
    <div className="bg-surface border border-border rounded-xl p-8">
      <h1 className="font-display text-xl font-bold mb-1">Tekrar hoş geldin.</h1>
      <p className="text-sm text-text-muted mb-6">
        Radarına devam etmek için giriş yap.
      </p>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-mono text-text-muted uppercase">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-ink border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal/50 transition"
            placeholder="sen@sirket.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-mono text-text-muted uppercase">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full bg-ink border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal/50 transition"
            placeholder="••••••••"
          />
        </div>

        {state.error && (
          <p className="text-xs text-negative flex items-center gap-1.5">
            <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="text-xs text-text-muted text-center mt-6">
        Hesabın yok mu?{" "}
        <Link href="/signup" className="text-signal hover:underline underline-offset-4">
          Kayıt ol
        </Link>
      </p>
    </div>
  )
}
