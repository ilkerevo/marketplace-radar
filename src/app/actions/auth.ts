"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const credentialsSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi gir."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
})

export interface AuthFormState {
  error?: string
  info?: string
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "E-posta veya şifre hatalı."
          : error.message,
    }
  }

  redirect("/dashboard")
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp(parsed.data)

  if (error) {
    return {
      error:
        error.message === "User already registered"
          ? "Bu e-posta zaten kayıtlı. Giriş yapmayı dene."
          : error.message,
    }
  }

  // Supabase projende "Confirm email" açıksa session hemen dönmez —
  // kullanıcı e-postasını onaylamadan giriş yapamaz.
  if (!data.session) {
    return {
      info: "Kayıt oluşturuldu. Hesabını doğrulamak için e-postana gönderdiğimiz linke tıkla.",
    }
  }

  redirect("/dashboard")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
