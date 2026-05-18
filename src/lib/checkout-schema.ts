import { z } from "zod";

export const selectedNoteIdsSchema = z.object({
  top: z.array(z.string()).default([]),
  middle: z.array(z.string()).default([]),
  base: z.array(z.string()).default([])
});

export const checkoutRequestSchema = z.object({
  perfumeName: z.string().trim().min(2).max(80),
  selectedNoteIds: selectedNoteIdsSchema,
  bottleSizeId: z.string().min(1),
  scentStrengthId: z.string().min(1),
  specialInstructions: z.string().trim().max(1200).optional().default("")
});

export const checkoutBagRequestSchema = z.object({
  items: z.array(checkoutRequestSchema).min(1).max(10),
  promoCode: z.string().trim().max(40).optional().default(""),
  customerPhone: z.string().trim().max(24).optional().default(""),
  callOptIn: z.boolean().optional().default(false)
}).superRefine((value, ctx) => {
  if (value.callOptIn && !value.customerPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customerPhone"],
      message: "Enter a phone number to receive order status calls."
    });
  }
});
