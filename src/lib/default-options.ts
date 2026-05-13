import type { ProductOptions } from "@/lib/types";

export const defaultOptions: ProductOptions = {
  bottleSizes: [
    { id: "travel", name: "Travel Atomizer", ml: 10, price: 38, active: true },
    { id: "signature", name: "Signature Bottle", ml: 50, price: 118, active: true },
    { id: "collector", name: "Collector Bottle", ml: 100, price: 188, active: true }
  ],
  scentStrengths: [
    { id: "eau-de-toilette", name: "Eau de Toilette", description: "Airy and wearable.", priceModifier: 0, active: true },
    { id: "eau-de-parfum", name: "Eau de Parfum", description: "Balanced projection and depth.", priceModifier: 18, active: true },
    { id: "extrait", name: "Extrait", description: "Long-lasting and richly concentrated.", priceModifier: 36, active: true }
  ],
  pricingRules: {
    includedNotes: 6,
    extraNotePrice: 8
  }
};
