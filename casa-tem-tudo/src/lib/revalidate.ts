import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "./public-data";

export function revalidateCatalog() {
  revalidateTag(TAGS.catalog);
  revalidatePath("/", "layout");
}

export function revalidateSettings() {
  revalidateTag(TAGS.settings);
  revalidatePath("/", "layout");
}

export function revalidateTestimonials() {
  revalidateTag(TAGS.testimonials);
  revalidatePath("/", "layout");
}
