import { PasswordForm } from "@/components/admin/password-form";
import { PageTitle } from "@/components/admin/sidebar";
import { requirePageUser } from "@/lib/auth";

export const metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const me = await requirePageUser();
  return (
    <>
      <PageTitle title="Minha conta" description={`${me.name} · ${me.email}`} />
      <PasswordForm />
    </>
  );
}
