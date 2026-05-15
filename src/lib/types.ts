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

export type EmailEvent = {
  id: string;
  orderId?: string;
  type: "customer_confirmation" | "admin_new_order" | "status_update" | "contact_customer" | "contact_admin" | "contact_reply" | "contact_follow_up" | "contact_follow_up_customer";
  to: string[];
  subject: string;
  status: "sent" | "skipped" | "failed";
  resendId?: string;
  error?: string;
  createdAt?: Timestamp;
};

export type ContactMessage = {
  id: string;
  from: "customer" | "admin" | "system";
  senderName: string;
  senderEmail?: string;
  subject?: string;
  body: string;
  createdAt?: string;
};

export type ContactQuery = {
  id: string;
  code: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  messages?: ContactMessage[];
  status: "open" | "closed";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastMessageAt?: Timestamp;
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
