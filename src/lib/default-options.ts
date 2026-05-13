import type { ProductOptions } from "@/lib/types";

export const defaultOptions: ProductOptions = {
  bottleSizes: [
    { id: "travel", name: "Travel Atomizer", ml: 10, price: 28, active: true },
    { id: "signature", name: "Signature Bottle", ml: 50, price: 88, active: true },
    { id: "collector", name: "Collector Bottle", ml: 100, price: 148, active: true }
  ],
  scentStrengths: [
    { id: "eau-de-toilette", name: "Eau de Toilette", description: "Airy and wearable.", priceModifier: 0, active: true },
    { id: "eau-de-parfum", name: "Eau de Parfum", description: "Balanced projection and depth.", priceModifier: 12, active: true },
    { id: "extrait", name: "Extrait", description: "Long-lasting and richly concentrated.", priceModifier: 24, active: true }
  ],
  pricingRules: {
    includedNotes: 6,
    extraNotePrice: 5,
    maxNotes: 12
  }
};
