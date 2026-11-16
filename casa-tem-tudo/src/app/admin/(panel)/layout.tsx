import { AdminShell } from "@/components/admin/sidebar";
import { requirePageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return <AdminShell user={{ name: user.name, role: user.role }}>{children}</AdminShell>;
}
