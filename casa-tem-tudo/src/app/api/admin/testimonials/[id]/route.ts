import type { NextRequest } from "next/server";
import { handler, HttpError, json, parseBody, parseId, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { deleteTestimonial, getTestimonial, updateTestimonial } from "@/lib/data/testimonials";
import { revalidateTestimonials } from "@/lib/revalidate";
import { testimonialInputSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function load(raw: string) {
  const t = await getTestimonial(parseId(raw));
  if (!t) throw new HttpError(404, "Avaliação não encontrada.");
  return t;
}

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  const input = await parseBody(req, testimonialInputSchema);
  await updateTestimonial(current.id, input);
  await logActivity(user.id, "update", "testimonial", current.id, `Editou avaliação de “${input.authorName}”`);
  revalidateTestimonials();
  return json({ testimonial: await getTestimonial(current.id) });
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireApiUser(req);
  const current = await load((await params).id);
  await deleteTestimonial(current.id);
  await logActivity(user.id, "delete", "testimonial", current.id, `Removeu avaliação de “${current.authorName}”`);
  revalidateTestimonials();
  return json({ ok: true });
});
