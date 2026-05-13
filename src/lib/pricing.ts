import type { BottleSize, PricingRules, ScentStrength, SelectedNotes } from "@/lib/types";

export function selectedNoteCount(notes: SelectedNotes) {
  return notes.top.length + notes.middle.length + notes.base.length;
}

export function calculatePrice(size: BottleSize | null, strength: ScentStrength | null, notes: SelectedNotes, rules: PricingRules) {
  if (!size || !strength) return 0;
  const includedNotes = rules.includedNotes ?? 6;
  const extraNotePrice = rules.extraNotePrice ?? 0;
  const extraNotes = Math.max(0, selectedNoteCount(notes) - includedNotes);
  return size.price + strength.priceModifier + extraNotes * extraNotePrice;
}
