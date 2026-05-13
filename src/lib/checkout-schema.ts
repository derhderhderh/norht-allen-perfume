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
  items: z.array(checkoutRequestSchema).min(1).max(10)
});
