"use client"

/**
 * Root layout'un KENDİSİ (Navbar dahil, çünkü Navbar layout.tsx içinde render
 * ediliyor) beklenmeyen bir hata fırlatırsa, normal error.tsx bunu YAKALAYAMAZ
 * — root layout, error.tsx'in de üstünde olduğu için. Next.js bu durumda özel
 * olarak global-error.tsx'i arar.
 *
 * Bu dosya tüm html/body'yi kendi baştan render eder (root layout devre dışı
 * kaldığı için Tailwind class'ları ve font değişkenleri güvenilir şekilde
 * yüklenmemiş olabilir) — bu yüzden bilerek inline stil kullanılıyor.
 *
 * Navbar'ı artık try/catch ile güvenli hale getirdiğimiz için bu dosyanın
 * tetiklenmesi beklenmiyor, ama gerçekten beklenmeyen bir kök hata olursa
 * (örn. font yükleme hatası, env okuma sırasında senkron bir crash) kullanıcı
 * en azından Next.js'in çıplak hata ekranı yerine anlaşılır bir mesaj görür.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body
        style={{
          backgroundColor: "#0B1420",
          color: "#E7ECF3",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          Uygulama şu an açılamıyor.
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#8493A8",
            marginBottom: "24px",
            maxWidth: "360px",
            lineHeight: 1.5,
          }}
        >
          Beklenmeyen bir hata oluştu. Birkaç dakika sonra tekrar dener misin?
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#4CD6E0",
            color: "#0B1420",
            fontWeight: 700,
            padding: "10px 22px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Tekrar dene
        </button>
      </body>
    </html>
  )
}
