import { SettingsForm } from "@/components/admin/settings-form";
import { PageTitle } from "@/components/admin/sidebar";
import { requirePageUser } from "@/lib/auth";
import { readSettings } from "@/lib/data/settings";

export const metadata = { title: "Configurações do site" };

export default async function AdminSettings() {
  const user = await requirePageUser("admin");
  const settings = await readSettings();
  return (
    <>
      <PageTitle title="Configurações do site" description="Informações da empresa, textos, imagens e dados para o Google." />
      <SettingsForm initial={settings} canEdit={user.role === "admin"} />
    </>
  );
}
