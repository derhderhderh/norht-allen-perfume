import { Timestamp } from "firebase/firestore";

export type NoteCategory = "top" | "middle" | "base";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "in_production"
  | "ready_to_ship"
  | "shipped"
  | "completed"
  | "cancelled";

export type FragranceNote = {
  id: string;
  name: string;
  category: NoteCategory;
  description: string;
  imageUrl?: string;
  active: boolean;
  createdAt?: Timestamp;
};

export type BottleSize = {
  id: string;
  name: string;
  ml: number;
  price: number;
  active: boolean;
};

export type ScentStrength = {
  id: string;
  name: string;
  description: string;
  priceModifier: number;
  active: boolean;
};

export type PricingRules = {
  extraNotePrice: number;
  includedNotes: number;
  maxNotes: number;
};

export type PromoCode = {
  id: string;
  code: string;
  description: string;
  active: boolean;
  percentOff: 100;
  createdAt?: Timestamp;
};

export type ProductOptions = {
  bottleSizes: BottleSize[];
  scentStrengths: ScentStrength[];
  pricingRules: PricingRules;
};

export type SelectedNotes = {
  top: FragranceNote[];
  middle: FragranceNote[];
  base: FragranceNote[];
};

export type SelectedNoteIds = {
  top: string[];
  middle: string[];
  base: string[];
};

export type PerfumeOrder = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  perfumeName: string;
  selectedNotes: SelectedNotes;
  bottleSize: BottleSize;
  scentStrength: ScentStrength;
  specialInstructions: string;
  subtotal?: number;
  discountAmount?: number;
  promoCode?: string;
  price: number;
  stripeSessionId?: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  orderStatus: OrderStatus;
  createdAt?: Timestamp;
};

export const orderStatuses: OrderStatus[] = [
  "pending_payment",
  "paid",
  "in_production",
  "ready_to_ship",
  "shipped",
  "completed",
  "cancelled"
];
