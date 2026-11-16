import { z } from "zod";
import { CATEGORY_ICONS } from "./category-icons";

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^\/media\/[a-f0-9]{24}\.webp$/.test(v), "Envie a imagem pelo botão de upload")
  .transform((v) => (v === "" ? null : v));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const slugField = z
  .string()
  .trim()
  .max(150)
  .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto").max(160),
  slug: slugField.optional().default(""),
  categoryId: z.coerce.number().int().positive().nullable().optional().default(null),
  shortDescription: z.string().trim().max(300).default(""),
  description: optionalText(5000).default(""),
  details: optionalText(3000).default(""),
  brand: optionalText(120).default(""),
  unit: optionalText(40).default(""),
  price: z
    .union([z.literal(""), z.null(), z.coerce.number().nonnegative("Preço inválido").max(9_999_999)])
    .transform((v) => (v === "" || v === null ? null : Math.round(v * 100) / 100))
    .default(null),
  imageUrl: imageUrl.default(""),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria").max(120),
  slug: slugField.optional().default(""),
  description: z.string().trim().max(500).default(""),
  icon: z.enum(CATEGORY_ICONS).default("boxes"),
  imageUrl: imageUrl.default(""),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const testimonialInputSchema = z.object({
  authorName: z.string().trim().min(2, "Informe o nome do autor").max(120),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(5, "Informe o texto da avaliação").max(1200),
  reviewDate: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .transform((v) => (v === "" ? null : v))
    .default(""),
  source: z.string().trim().min(2).max(40).default("Google"),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
});
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

export const passwordSchema = z
  .string()
  .min(10, "A senha deve ter pelo menos 10 caracteres")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letras e números na senha");

export const userInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(190),
  role: z.enum(["admin", "editor"]),
  active: z.boolean().default(true),
  password: z.union([z.literal(""), passwordSchema]).optional().default(""),
});
export type UserInput = z.infer<typeof userInputSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
