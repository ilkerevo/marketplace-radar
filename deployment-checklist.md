# Marketplace Radar — Deployment Checklist

Bu doküman üç bölümden oluşuyor: Vercel environment variable listesi, Supabase production migration checklist'i ve iyzico sandbox → live geçiş notları. Sırayla takip et.

---

## 1. Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables altına aşağıdakileri ekle. **Production**, **Preview** ve **Development** ortamları için ayrı ayrı işaretleyebilirsin — özellikle `IYZICO_*` ve `NEXT_PUBLIC_APP_URL` değerleri ortama göre farklı olmalı (aşağıda not edildi).

| Değişken | Açıklama | Nereden alınır | Ortam notu |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i | Supabase Dashboard → Settings → API | Prod/Preview aynı olabilir (tek proje kullanıyorsan) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard → Settings → API | Aynı |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS bypass eden gizli key | Supabase Dashboard → Settings → API | **Asla `NEXT_PUBLIC_` prefix'i verme.** Sadece server-side kullanılıyor (`admin.ts`, webhook route) |
| `ANTHROPIC_API_KEY` | Claude API key | Anthropic Console → API Keys | Server-only |
| `NEXT_PUBLIC_APP_URL` | Uygulamanın canlı URL'i | — | **Ortama göre değişir:** Production'da `https://marketplaceradar.com`, Preview'de Vercel'in otomatik ürettiği preview URL (`VERCEL_URL` ile dinamik çözülebilir — aşağıya bak) |
| `IYZICO_API_KEY` | iyzico API key | iyzico Merchant Panel | Sandbox ve Live için **farklı değerler** — bkz. Bölüm 3 |
| `IYZICO_SECRET_KEY` | iyzico secret key | iyzico Merchant Panel | Aynı şekilde ortama göre farklı |
| `IYZICO_BASE_URL` | iyzico API base URL | — | Sandbox: `https://sandbox-api.iyzipay.com` / Live: `https://api.iyzipay.com` |

### `NEXT_PUBLIC_APP_URL` için pratik çözüm

Preview deploy'larda her seferinde farklı bir URL üretildiği için bunu elle güncellemek yerine `next.config.js` içinde Vercel'in kendi sağladığı `VERCEL_URL` değişkenini fallback olarak kullanabilirsin:

```typescript
// Herhangi bir server dosyasında kullanmak için küçük bir yardımcı:
export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}
```

`checkout.ts` ve iyzico callback route'undaki `process.env.NEXT_PUBLIC_APP_URL!` referanslarını `getAppUrl()` ile değiştirmen preview deploy'larda ödeme testini kolaylaştırır. Production'da `NEXT_PUBLIC_APP_URL`'i sabit domain olarak set etmeyi unutma — Vercel her production deploy'da farklı bir `VERCEL_URL` üretebilir, iyzico callback'in kararlı bir domain'e ihtiyacı var.

### Sanity check

Deploy sonrası Vercel → Deployments → son deploy → Functions sekmesinden bir server action'ın loglarını kontrol et; `undefined` env variable hatası çıkıyorsa büyük ihtimalle bu tablo eksik.

---

## 2. Supabase Production Migration Checklist

### 2.1 SQL migration sırası

Bu konuşma boyunca oluşturduğumuz tüm SQL parçalarını **tek bir migration dosyası** halinde, aşağıdaki sırayla çalıştır (Supabase Dashboard → SQL Editor, ya da `supabase db push` ile CLI üzerinden):

```sql
-- 1. Extension
create extension if not exists "uuid-ossp";

-- 2. Tablolar (users → products → analyses → payments sırasıyla,
--    foreign key bağımlılıkları yüzünden bu sıra önemli)
create table public.users ( ... );
create table public.products ( ... );  -- user_id kolonu dahil
create table public.analyses ( ... );
create table public.payments ( ... );

-- 3. İndeksler
create index idx_analyses_product_id on public.analyses(product_id);
create index idx_products_marketplace on public.products(marketplace);
create index idx_products_user_id on public.products(user_id);
create index idx_users_email on public.users(email);
create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_conversation_id on public.payments(conversation_id);

-- 4. RLS aktivasyonu + policy'ler
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.analyses enable row level security;
alter table public.payments enable row level security;
-- (policy'lerin tamamı için önceki mesajlara bak)

-- 5. Fonksiyonlar ve trigger'lar
create function public.handle_new_user() ...
create trigger on_auth_user_created ...
create function public.increment_user_credits(...) ...
```

**Neden bu sıra önemli:** `analyses.product_id` → `products.id` foreign key'i, `products` tablosu var olmadan oluşturulamaz. Aynı şekilde trigger, referans verdiği `handle_new_user()` fonksiyonundan sonra gelmeli.

### 2.2 RLS Policy Özet Tablosu (mevcut durumun onaylanmış hali)

| Tablo | SELECT | INSERT | UPDATE |
|---|---|---|---|
| `users` | Sadece kendi kaydı (`auth.uid() = id`) | Trigger üzerinden otomatik (`security definer`, RLS bypass) | Sadece kendi kaydı |
| `products` | **Herkese açık** (viral loop için bilinçli karar) | `authenticated` rolü, `with check (true)` | — |
| `analyses` | **Herkese açık** (viral loop için bilinçli karar) | `authenticated` rolü, `with check (true)` | — |
| `payments` | Sadece kendi kaydı | Sadece `service_role` (admin client üzerinden, RLS bypass) | Sadece `service_role` |

> `products`/`analyses` public SELECT kalıyor çünkü `/analysis/[id]` linkinin login olmadan paylaşılabilir olması bilinçli bir büyüme kararı — bunu daha önce onayladın. Eğer ileride fikrini değiştirirsen, `using (true)` yerine `using (auth.uid() = (select user_id from products where id = product_id))` gibi owner-only bir koşula geçmen yeterli.

### 2.3 Auth callback / redirect URL yapılandırması

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://marketplaceradar.com` (production domain'in)
- **Redirect URLs** listesine şunları ekle:
  - `https://marketplaceradar.com/**` (production, wildcard)
  - `https://*.vercel.app/**` (preview deploy'lar için — Vercel her PR'da yeni subdomain üretir)
  - `http://localhost:3000/**` (lokal geliştirme)

Bu liste eksikse, `signUp`/`signIn` sonrası e-posta doğrulama linkleri veya OAuth redirect'leri "requested path is invalid" hatasıyla patlar.

### 2.4 Email template kontrolü

Supabase Dashboard → Authentication → Email Templates → **Confirm signup**: Varsayılan template'i Türkçeleştirmeyi düşün (şu an İngilizce gelir, ürünün geri kalanı Türkçe). En azından "Confirm your email" butonunun linkinin doğru domain'e gittiğini deploy sonrası bir kere gerçek e-posta ile test et.

### 2.5 Connection pooling

Next.js Server Actions / Route Handler'lar serverless ortamda her istekte yeni bağlantı açabilir. Supabase Dashboard → Settings → Database'den **connection pooling (PgBouncer, port 6543)** modunun aktif olduğunu doğrula — trafik arttığında "too many connections" hatasını önler. `@supabase/ssr` zaten HTTP tabanlı çalıştığı için bu genelde otomatik doğru gelir, ama proje büyürse Database → Connection Pooling sekmesinden teyit etmekte fayda var.

### 2.6 Deploy öncesi son kontrol

- [ ] Migration'ı önce bir **staging/preview Supabase projesinde** test et, sonra production'a uygula
- [ ] `service_role` key'inin sadece server-side env variable olarak set edildiğini doğrula (client bundle'da aramak için `next build` sonrası `.next/static` içinde grep atabilirsin)
- [ ] Trigger'ı test et: Dashboard'dan manuel bir test kullanıcı signup'ı yap, `public.users` tablosunda otomatik satır oluştu mu bak

---

## 3. iyzico Sandbox → Live Geçiş

### 3.1 API key değişimi

| | Sandbox | Live |
|---|---|---|
| `IYZICO_API_KEY` | Merchant Panel → Sandbox sekmesi | Merchant Panel → **Canlı** sekmesi (ayrı bir key seti) |
| `IYZICO_SECRET_KEY` | Aynı şekilde sandbox'a özel | Aynı şekilde live'a özel |
| `IYZICO_BASE_URL` | `https://sandbox-api.iyzipay.com` | `https://api.iyzipay.com` |

Live key'leri almak için iyzico'nun **üye işyeri onay sürecini** tamamlamış olman gerekiyor (şirket evrakları, banka hesabı doğrulama vb. — bu süreç birkaç gün sürebilir, deployment planına dahil et).

### 3.2 `identityNumber` ve gerçek buyer bilgileri — kritik

Daha önce kod içinde placeholder olarak bıraktığımız şu alanlar **live ortamda gerçek veri olmadan işlemler reddedilir veya risk skoru düşük çıkar**:

```typescript
identityNumber: "11111111111", // ← placeholder, DEĞİŞTİRİLMELİ
gsmNumber: "+905000000000",    // ← placeholder, DEĞİŞTİRİLMELİ
```

Live'a geçmeden önce checkout akışına bir adım eklemen gerekiyor: kullanıcıdan **TC Kimlik No** (bireysel) veya **Vergi No** (kurumsal) ve **gerçek telefon numarası** toplayan bir form. Bunu `pricing` sayfasından `initiateCheckoutAction`'ı çağırmadan önce bir modal/adım olarak ekleyebiliriz — istersen bir sonraki adımda bunu yapalım.

### 3.3 Webhook / callback URL güncellemesi

`callbackUrl: `${appUrl}/api/payments/iyzico/callback`` kodda zaten dinamik (`NEXT_PUBLIC_APP_URL`'e bağlı) — ekstra bir "iyzico panelinde webhook URL kaydet" adımı **gerekmiyor**, çünkü iyzico'nun checkout form akışında callback URL her istekle birlikte gönderiliyor (statik panel ayarı değil). Tek yapman gereken: `NEXT_PUBLIC_APP_URL`'in production'da doğru, HTTPS'li ve public erişilebilir olduğunu doğrulamak.

> Not: iyzico'nun ayrıca **3D Secure sonrası callback** mekanizması var — sandbox'ta test ederken bu callback'in senin domain'ine (localhost değil, örn. ngrok veya Vercel preview URL) ulaşabildiğinden emin ol, aksi halde ödeme "PENDING" durumunda takılı kalır.

### 3.4 Sandbox test kartlarından gerçek karta geçiş

Sandbox'ta iyzico'nun sağladığı test kartlarıyla (`5528790000000008` gibi) çalıştın. Live'a geçtiğinde bu kartlar çalışmaz — ilk canlı testi **kendi gerçek kartınla, küçük bir tutarla** (örn. en ucuz Starter paketi) yapıp uçtan uca doğrula:
1. Ödeme başarıyla tamamlanıyor mu
2. `payments` tablosunda `status: SUCCESS` yazıyor mu
3. `users.credits` doğru artıyor mu
4. Dashboard'da `?payment=success` banner'ı görünüyor mu

### 3.5 Taksit seçenekleri

`enabledInstallments: [1, 2, 3, 6, 9]` kodda sabit tanımlı. Live ortamda iyzico, üye işyeri anlaşmana göre bazı taksit seçeneklerini otomatik kapatabilir (banka anlaşmaları vs.) — bu senin kontrolünde değil, iyzico tarafında yönetiliyor, ekstra kod değişikliği gerekmiyor.

### 3.6 İdempotency doğrulaması

`callback/route.ts` içindeki şu kontrolü live'da mutlaka canlı tut — iyzico'nun retry mekanizması aynı callback'i birden fazla tetikleyebilir:

```typescript
if (paymentRow.status === "SUCCESS") {
  return NextResponse.redirect(`${appUrl}/dashboard?payment=already_processed`)
}
```

Bunu kaldırmak veya bypass etmek, bir ödemenin kullanıcıya birden fazla kez kredi olarak yansımasına (çift kredi) yol açabilir.

### 3.7 Canlıya geçiş öncesi son kontrol

- [ ] Live API key'leri Vercel Production environment'a eklendi (Preview/Development'a **eklenmedi** — sandbox key'leri orada kalmalı)
- [ ] `identityNumber` toplama formu eklendi (bkz. 3.2)
- [ ] `NEXT_PUBLIC_APP_URL` production domain'ine sabitlendi
- [ ] Gerçek kartla uçtan uca test yapıldı (bkz. 3.4)
- [ ] iyzico Merchant Panel'de "Live mode" aktif ve onaylı

---

## Genel Deploy Sırası (özet)

1. Supabase production projesini oluştur, migration'ı çalıştır (Bölüm 2)
2. Vercel'e repo'yu bağla, tüm env variable'ları ekle (Bölüm 1) — **sandbox** iyzico key'leriyle ilk deploy'u yap
3. Sandbox ortamında uçtan uca test et: signup → tarama → analiz → pricing → sandbox ödeme → kredi ekleniyor mu
4. iyzico live onayı tamamlandıktan sonra Production env variable'larını live key'lerle güncelle (Bölüm 3)
5. `identityNumber` toplama adımını ekle, gerçek kartla son testi yap
6. Yayında 🎉
