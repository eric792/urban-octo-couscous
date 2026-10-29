import { z } from "zod";
import { PROVINCES } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

export const cartItemsSchema = z
  .array(
    z.object({
      variantId: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(20),
    }),
  )
  .min(1, "Your bag is empty")
  .max(30);

export const deliveryMethodSchema = z.enum(["PARGO_PICKUP_POINT", "PARGO_COURIER_DOOR", "STANDARD_COURIER"]);

export const quoteSchema = z.object({
  items: cartItemsSchema,
  deliveryMethod: deliveryMethodSchema,
  discountCode: z.string().trim().max(40).optional(),
});

export const addressSchema = z.object({
  street: z.string().trim().min(3, "Enter your street address").max(120),
  suburb: z.string().trim().min(2, "Enter your suburb").max(80),
  city: z.string().trim().min(2, "Enter your city").max(80),
  province: z.enum(PROVINCES, { error: "Choose a province" }),
  postalCode: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit postal code"),
});

export const pickupPointSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().max(200),
  suburb: z.string().trim().max(100),
  city: z.string().trim().max(100),
  province: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().max(10),
  businessHours: z.string().trim().max(300),
});

const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^0\d{9}$/, "Enter a valid SA phone number, e.g. 082 123 4567"));

export const checkoutSchema = quoteSchema
  .extend({
    customer: z.object({
      firstName: z.string().trim().min(1, "Enter your first name").max(60),
      lastName: z.string().trim().min(1, "Enter your last name").max(60),
      email: z.email("Enter a valid email address").max(160),
      phone: phoneSchema,
    }),
    gateway: z.enum(["YOCO", "PAYFAST", "EFT"]),
    address: addressSchema.optional(),
    pickupPoint: pickupPointSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "PARGO_PICKUP_POINT" && !data.pickupPoint) {
      ctx.addIssue({ code: "custom", path: ["pickupPoint"], message: "Choose a Pargo pickup point" });
    }
    if (data.deliveryMethod !== "PARGO_PICKUP_POINT" && !data.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Enter a delivery address" });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

/** Flattens zod issues into { "customer.email": "message" }. */
export function issuesToErrors(issues: z.core.$ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
