export const MARKETPLACE_CONFIG: Record<string, { label: string; color: string }> = {
  trendyol: { label: "Trendyol", color: "#F27A1A" },
  hepsiburada: { label: "Hepsiburada", color: "#FF6000" },
  amazon: { label: "Amazon", color: "#FF9900" },
}

export function getMarketplaceConfig(marketplace: string) {
  return MARKETPLACE_CONFIG[marketplace] ?? { label: marketplace, color: "#8493A8" }
}
