import { PageTitle } from "@/components/admin/sidebar";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import { listTestimonials } from "@/lib/data/testimonials";

export const metadata = { title: "Avaliações" };

export default async function AdminTestimonials() {
  const items = await listTestimonials({ includeInactive: true });
  return (
    <>
      <PageTitle title="Avaliações" description="Depoimentos exibidos na página inicial. A nota média e o total do Google ficam em Configurações do site." />
      <TestimonialsManager initial={items} />
    </>
  );
}
