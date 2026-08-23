# Marketplace Radar

Trendyol ürün yorumlarını AI ile analiz eden micro-SaaS.

## Teknoloji

- Next.js 14 (App Router, TypeScript)
- TailwindCSS
- Supabase (PostgreSQL + Auth)
- Claude API (yorum analizi)
- iyzico (ödeme — sandbox modunda kurulu)
- Recharts, lucide-react

## Kurulum

```bash
npm install
cp .env.local.example .env.local
# .env.local içindeki değerleri doldur (Supabase, Anthropic, iyzico)
npm run dev
```

## Veritabanı kurulumu

`supabase/migrations/0001_init.sql` dosyasını Supabase Dashboard → SQL Editor'de
çalıştır (ya da Supabase CLI ile `supabase db push`). Bu dosya şunları içerir:

- `users`, `products`, `analyses`, `payments` tabloları
- Gerekli indeksler
- RLS policy'leri (`products`/`analyses` bilinçli olarak public — paylaşılabilir
  analiz linki için)
- Yeni kullanıcı signup olduğunda otomatik `public.users` satırı oluşturan trigger
- Kredi ekleme için atomik RPC fonksiyonu

## Database types

`src/types/database.types.ts` elle yazıldı, gerçek Supabase şemanla eşleşir.
Şemayı değiştirirsen, Supabase CLI ile otomatik yeniden üretebilirsin:

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
```

## Klasör yapısı

```
src/
  app/
    (auth)/login, (auth)/signup   — auth sayfaları
    actions/                       — server actions (analyze, auth, checkout)
    analysis/[id]                  — analiz detay sayfası (public, paylaşılabilir)
    api/payments/iyzico/callback   — iyzico ödeme callback route handler
    dashboard/                     — kullanıcının geçmiş analizleri
    pricing/                       — kredi paketleri satın alma
    page.tsx                       — ana tarama akışı
  components/                      — UI bileşenleri
  lib/
    ai/analyzer.ts                 — Claude API entegrasyonu
    scraper/trendyol.ts             — Trendyol yorum/ürün scraping
    payment/                       — iyzico client + paket tanımları
    supabase/                      — client/server/admin Supabase client'ları
  middleware.ts                    — auth korumalı route yönlendirmesi
```

## Deployment

Detaylı Vercel + Supabase + iyzico canlıya alma adımları için
`deployment-checklist.md` dosyasına bak. Özetle:

1. Supabase migration'ı production projede çalıştır
2. Vercel'e repo'yu bağla, `.env.local.example`'daki tüm değişkenleri ekle
3. Supabase Auth → URL Configuration'a production/preview domain'lerini ekle
4. Sandbox modunda uçtan uca test et
5. iyzico live onayı sonrası `identityNumber` toplama adımını ekleyip live key'lere geç

## Bilinen sınırlamalar (MVP)

- Scraping sadece Trendyol için kurulu (Hepsiburada/Amazon henüz yok)
- iyzico checkout'ta `identityNumber` (TC Kimlik/Vergi No) şu an placeholder —
  live'a geçmeden önce gerçek bir formla toplanmalı (bkz. deployment-checklist.md § 3.2)
- Trendyol'un iç API'leri resmi/dokümante değil, haber verilmeden değişebilir
