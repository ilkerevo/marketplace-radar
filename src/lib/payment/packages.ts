export interface CreditPackage {
  id: string
  name: string
  credits: number
  priceTRY: number
  description: string
  highlight?: boolean
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 20,
    priceTRY: 299,
    description: "Birkaç ürünü test etmek isteyenler için.",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 60,
    priceTRY: 699,
    description: "Aktif satıcılar için en dengeli paket.",
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    credits: 200,
    priceTRY: 1999,
    description: "Ajanslar ve çoklu mağaza yönetenler için.",
  },
]

export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id)
}
