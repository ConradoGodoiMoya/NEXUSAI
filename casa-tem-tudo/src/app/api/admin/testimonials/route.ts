import type { NextRequest } from "next/server";
import { handler, json, parseBody, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { createTestimonial, getTestimonial, listTestimonials } from "@/lib/data/testimonials";
import { revalidateTestimonials } from "@/lib/revalidate";
import { testimonialInputSchema } from "@/lib/validation";

export const GET = handler(async (req: NextRequest) => {
  await requireApiUser(req);
  return json({ items: await listTestimonials({ includeInactive: true }) });
});

export const POST = handler(async (req: NextRequest) => {
  const user = await requireApiUser(req);
  const input = await parseBody(req, testimonialInputSchema);
  const id = await createTestimonial(input);
  await logActivity(user.id, "create", "testimonial", id, `Adicionou avaliação de “${input.authorName}”`);
  revalidateTestimonials();
  return json({ testimonial: await getTestimonial(id) }, 201);
});
